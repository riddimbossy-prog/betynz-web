import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  try{
    const authHeader=req.headers.get("Authorization")??"";
    const url=Deno.env.get("SUPABASE_URL")!;
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
    const {data:{user}}=await userClient.auth.getUser();
    if(!user)return json({error:"Unauthorized"},401);
    const body=await req.json().catch(()=>({}));
    if(body.confirm!=="CANCEL_RENEWAL")return json({error:"Confirmation required"},400);

    const admin=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const {data:sub,error:subError}=await admin.from("subscriptions")
      .select("id,provider_subscription_id,provider_email_token,current_period_end,cancel_at_period_end")
      .eq("user_id",user.id).eq("provider","paystack")
      .in("status",["active","trialing","past_due"])
      .in("cycle",["monthly","annual"])
      .order("current_period_end",{ascending:false}).limit(1).maybeSingle();
    if(subError)throw subError;
    if(!sub)return json({error:"No cancellable recurring subscription was found."},404);
    if(sub.cancel_at_period_end)return json({ok:true,message:"Automatic renewal is already cancelled."});
    if(!sub.provider_subscription_id||!sub.provider_email_token)return json({error:"The payment provider has not supplied cancellation credentials yet."},409);

    const secret=Deno.env.get("PAYSTACK_SECRET_KEY")||"";
    const response=await fetch("https://api.paystack.co/subscription/disable",{
      method:"POST",
      headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},
      body:JSON.stringify({code:sub.provider_subscription_id,token:sub.provider_email_token})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result?.status)return json({error:result?.message||"Provider cancellation failed."},502);

    await admin.from("subscriptions").update({cancel_at_period_end:true,status:"cancelled",updated_at:new Date().toISOString()}).eq("id",sub.id);
    await admin.from("account_audit_log").insert({user_id:user.id,event_type:"subscription_cancelled",metadata:{provider:"paystack",access_until:sub.current_period_end}});
    return json({ok:true,message:"Automatic renewal cancelled. Access remains until the paid period ends."});
  }catch(error){
    console.error("cancel subscription error",error);
    return json({error:error instanceof Error?error.message:"Cancellation failed"},500);
  }
});
