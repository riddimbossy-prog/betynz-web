import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})}
function safeMetadata(value:unknown):Record<string,unknown>{
  if(value&&typeof value==="object"&&!Array.isArray(value))return value as Record<string,unknown>;
  if(typeof value==="string")try{const parsed=JSON.parse(value);return parsed&&typeof parsed==="object"?parsed:{}}catch(_){return {}};
  return {};
}
function str(value:unknown){return typeof value==="string"?value.trim():""}
function validPlan(value:string){return ["pro","supreme","day"].includes(value)}
function validCycle(value:string){return ["monthly","annual","day"].includes(value)}
function addPeriod(base:Date,cycle:string){
  const d=new Date(base);
  if(cycle==="annual")d.setUTCFullYear(d.getUTCFullYear()+1);
  else if(cycle==="monthly")d.setUTCMonth(d.getUTCMonth()+1);
  else d.setTime(d.getTime()+24*60*60*1000);
  return d;
}
async function hmacHex(secret:string,payload:string){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-512"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,enc.encode(payload));
  return [...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function constantTimeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}

Deno.serve(async(req)=>{
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const secret=Deno.env.get("PAYSTACK_SECRET_KEY")||"";
  if(!secret)return json({error:"Webhook secret is unavailable"},503);
  const raw=await req.text();
  const provided=(req.headers.get("x-paystack-signature")||"").toLowerCase();
  const expected=await hmacHex(secret,raw);
  if(!provided||!constantTimeEqual(provided,expected))return json({error:"Invalid signature"},401);

  let payload:any;
  try{payload=JSON.parse(raw)}catch(_){return json({error:"Invalid JSON"},400)}
  const eventType=str(payload?.event)||"unknown";
  const data=payload?.data||{};
  const metadata=safeMetadata(data?.metadata);
  const reference=str(data?.reference)||str(data?.transaction?.reference);
  const subscriptionCode=str(data?.subscription?.subscription_code)||str(data?.subscription_code);
  const customerCode=str(data?.customer?.customer_code)||str(data?.customer_code);
  const invoiceCode=str(data?.invoice_code);
  const eventKey=`${eventType}:${reference||subscriptionCode||invoiceCode||str(data?.id)||crypto.randomUUID()}`;

  const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:existingEvent}=await admin.from("payment_events").select("status").eq("provider","paystack").eq("event_key",eventKey).maybeSingle();
  if(existingEvent?.status==="processed")return json({ok:true,duplicate:true});
  if(!existingEvent){
    const {error}=await admin.from("payment_events").insert({provider:"paystack",event_key:eventKey,event_type:eventType,status:"processing"});
    if(error&&error.code!=="23505")return json({error:"Could not reserve webhook event"},500);
  }else{
    await admin.from("payment_events").update({status:"processing",last_error:null,processed_at:new Date().toISOString()}).eq("provider","paystack").eq("event_key",eventKey);
  }

  try{
    let userId=str(metadata.betynz_user_id);
    let plan=str(metadata.plan);
    let cycle=str(metadata.cycle);
    let currentSub:any=null;

    if(subscriptionCode){
      const {data:bySubscription}=await admin.from("subscriptions").select("*").eq("provider","paystack").eq("provider_subscription_id",subscriptionCode).maybeSingle();
      if(bySubscription)currentSub=bySubscription;
    }
    if(!currentSub&&customerCode){
      const {data:byCustomer}=await admin.from("subscriptions").select("*").eq("provider","paystack").eq("provider_customer_id",customerCode).order("updated_at",{ascending:false}).limit(1).maybeSingle();
      if(byCustomer)currentSub=byCustomer;
    }
    if(currentSub){
      userId=userId||currentSub.user_id;
      plan=plan||currentSub.plan;
      cycle=cycle||currentSub.cycle;
    }

    if(eventType==="charge.success"){
      if(!userId||!validPlan(plan)||!validCycle(cycle))throw new Error("Successful charge is missing Betynz user or plan metadata.");
      const paidAt=new Date(str(data?.paid_at)||str(data?.paidAt)||new Date().toISOString());
      const base=currentSub?.current_period_end&&Date.parse(currentSub.current_period_end)>Date.now()?new Date(currentSub.current_period_end):paidAt;
      const periodEnd=addPeriod(base,cycle);
      const amountMinor=Number(data?.amount||0);
      const amount=Number.isFinite(amountMinor)?amountMinor/100:0;
      const currency=(str(data?.currency)||"GHS").toUpperCase();
      const emailToken=str(data?.subscription?.email_token)||str(data?.email_token)||currentSub?.provider_email_token||null;
      const providerSubId=subscriptionCode||currentSub?.provider_subscription_id||(cycle==="day"?`day:${reference}`:null);
      const description=cycle==="day"?"24-hour access":cycle==="annual"?"Annual subscription payment":"Monthly subscription payment";

      const subscriptionPayload={
        user_id:userId,provider:"paystack",provider_customer_id:customerCode||currentSub?.provider_customer_id||null,
        provider_subscription_id:providerSubId,provider_plan_code:str(data?.plan?.plan_code)||str(data?.plan_object?.plan_code)||currentSub?.provider_plan_code||null,
        provider_email_token:emailToken,plan,cycle,status:"active",amount,currency,current_period_end:periodEnd.toISOString(),
        cancel_at_period_end:false,last_payment_at:paidAt.toISOString(),updated_at:new Date().toISOString()
      };
      if(currentSub?.id){
        await admin.from("subscriptions").update(subscriptionPayload).eq("id",currentSub.id);
      }else{
        await admin.from("subscriptions").insert(subscriptionPayload);
      }
      if(reference){
        await admin.from("billing_records").upsert({
          user_id:userId,provider:"paystack",provider_event_id:reference,plan,amount,currency,status:"paid",description
        },{onConflict:"provider_event_id"});
      }
      await admin.from("account_audit_log").insert({user_id:userId,event_type:"payment_verified",metadata:{provider:"paystack",plan,cycle,reference,period_end:periodEnd.toISOString()}});
    }

    if(eventType==="subscription.create"&&currentSub){
      await admin.from("subscriptions").update({
        provider_subscription_id:subscriptionCode||currentSub.provider_subscription_id,
        provider_customer_id:customerCode||currentSub.provider_customer_id,
        provider_email_token:str(data?.email_token)||currentSub.provider_email_token,
        provider_plan_code:str(data?.plan?.plan_code)||currentSub.provider_plan_code,
        status:"active",cancel_at_period_end:false,updated_at:new Date().toISOString()
      }).eq("id",currentSub.id);
    }

    if(["subscription.disable","subscription.not_renew"].includes(eventType)&&currentSub){
      await admin.from("subscriptions").update({status:"cancelled",cancel_at_period_end:true,updated_at:new Date().toISOString()}).eq("id",currentSub.id);
      await admin.from("account_audit_log").insert({user_id:currentSub.user_id,event_type:"subscription_cancelled",metadata:{provider:"paystack",event:eventType}});
    }

    if(["charge.failed","invoice.payment_failed"].includes(eventType)&&currentSub){
      await admin.from("subscriptions").update({status:"past_due",updated_at:new Date().toISOString()}).eq("id",currentSub.id);
    }

    await admin.from("payment_events").update({status:"processed",last_error:null,processed_at:new Date().toISOString()}).eq("provider","paystack").eq("event_key",eventKey);
    return json({ok:true});
  }catch(error){
    const message=error instanceof Error?error.message:"Webhook processing failed";
    console.error("paystack webhook error",message);
    await admin.from("payment_events").update({status:"failed",last_error:message.slice(0,500),processed_at:new Date().toISOString()}).eq("provider","paystack").eq("event_key",eventKey);
    return json({error:message},500);
  }
});
