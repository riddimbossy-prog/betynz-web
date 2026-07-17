import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}

Deno.serve(async (req) => {
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const authHeader=req.headers.get("Authorization")??"";
  const userClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:authHeader}}});
  const {data:{user}}=await userClient.auth.getUser();
  if(!user)return json({error:"Unauthorized"},401);
  const body=await req.json().catch(()=>({}));
  if(body.confirm!=="DELETE")return json({error:"Confirmation required"},400);
  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await admin.from("account_audit_log").insert({user_id:user.id,event_type:"account_deleted",metadata:{}});
  const {error}=await admin.auth.admin.deleteUser(user.id);
  if(error)return json({error:error.message},500);
  return json({ok:true});
});
