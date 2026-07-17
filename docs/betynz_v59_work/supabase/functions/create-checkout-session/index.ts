import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const plans: Record<string,{plan:string;cycle:string;amountEnv:string;planEnv?:string}> = {
  pro_monthly:{plan:"pro",cycle:"monthly",amountEnv:"PAYSTACK_AMOUNT_PRO_MONTHLY",planEnv:"PAYSTACK_PLAN_PRO_MONTHLY"},
  pro_annual:{plan:"pro",cycle:"annual",amountEnv:"PAYSTACK_AMOUNT_PRO_ANNUAL",planEnv:"PAYSTACK_PLAN_PRO_ANNUAL"},
  supreme_monthly:{plan:"supreme",cycle:"monthly",amountEnv:"PAYSTACK_AMOUNT_SUPREME_MONTHLY",planEnv:"PAYSTACK_PLAN_SUPREME_MONTHLY"},
  supreme_annual:{plan:"supreme",cycle:"annual",amountEnv:"PAYSTACK_AMOUNT_SUPREME_ANNUAL",planEnv:"PAYSTACK_PLAN_SUPREME_ANNUAL"},
  day:{plan:"day",cycle:"day",amountEnv:"PAYSTACK_AMOUNT_DAY"}
};

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({error:"Method not allowed"},405);

  try{
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const client = createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authHeader}}});
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError||!user||!user.email)return json({error:"Unauthorized"},401);

    const {data:profile}=await client.from("profiles").select("id").maybeSingle();
    if(!profile)return json({error:"Complete the adult account profile before checkout."},403);

    const body=await req.json().catch(()=>({}));
    const key=body.plan==="day"?"day":`${body.plan}_${body.cycle}`;
    const product=plans[key];
    if(!product)return json({error:"Invalid plan"},400);

    const amount=Number.parseInt(Deno.env.get(product.amountEnv)||"",10);
    if(!Number.isInteger(amount)||amount<100)return json({error:`Missing or invalid ${product.amountEnv}`},503);

    const secret=Deno.env.get("PAYSTACK_SECRET_KEY")||"";
    if(!secret)return json({error:"Paystack is not configured"},503);

    const site=(Deno.env.get("BETYNZ_SITE_URL")||"https://betynz.com").replace(/\/$/,"");
    const currency=(Deno.env.get("PAYSTACK_CURRENCY")||"GHS").trim().toUpperCase();
    const reference=`betynz_${product.plan}_${product.cycle}_${crypto.randomUUID().replaceAll("-","")}`;
    const payload:Record<string,unknown>={
      email:user.email,
      amount,
      currency,
      reference,
      callback_url:`${site}/#billing`,
      metadata:{
        betynz_user_id:user.id,
        plan:product.plan,
        cycle:product.cycle,
        source:"betynz-web",
        cancel_action:`${site}/#billing`
      }
    };
    if(product.planEnv){
      const planCode=Deno.env.get(product.planEnv)||"";
      if(!planCode)return json({error:`Missing ${product.planEnv}`},503);
      payload.plan=planCode;
    }

    const response=await fetch("https://api.paystack.co/transaction/initialize",{
      method:"POST",
      headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result?.status||!result?.data?.authorization_url){
      return json({error:result?.message||"Payment provider rejected checkout initialization."},502);
    }
    return json({url:result.data.authorization_url,reference});
  }catch(error){
    console.error("checkout error",error);
    return json({error:error instanceof Error?error.message:"Checkout failed"},500);
  }
});
