import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ATTEMPTS=5;

function preferenceColumn(kind:string){
 if(kind==='message')return 'notify_messages';
 if(kind==='beacon')return 'notify_beacon';
 if(kind==='help_response')return 'notify_help_responses';
 if(kind==='help'||kind==='supply'||kind==='supply_match')return 'notify_nearby_help';
 return null;
}

Deno.serve(async(req)=>{
 const secret=req.headers.get('authorization');
 if(secret!==`Bearer ${Deno.env.get('PUSH_DISPATCH_SECRET')}`)return new Response('Unauthorized',{status:401});

 const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const{data:jobs,error}=await supabase.from('push_outbox').select('*').is('sent_at',null).order('created_at').limit(100);
 if(error)return new Response(error.message,{status:500});

 let sent=0,skipped=0,failed=0;
 for(const job of jobs||[]){
  try{
   const pref=preferenceColumn(job.kind);
   if(pref){
    const{data:profile}=await supabase.from('profiles').select(pref).eq('id',job.user_id).maybeSingle();
    if(profile&&profile[pref]===false){
     await supabase.from('push_outbox').update({sent_at:new Date().toISOString(),last_error:'disabled_by_user'}).eq('id',job.id);
     skipped++;
     continue;
    }
   }

   if((job.kind==='help'||job.kind==='beacon')&&job.entity_id){
    const{data:reqRow}=await supabase.from('help_requests').select('status,expires_at').eq('id',job.entity_id).maybeSingle();
    if(!reqRow||reqRow.status!=='open'||(reqRow.expires_at&&new Date(reqRow.expires_at).getTime()<=Date.now())){
     await supabase.from('push_outbox').update({sent_at:new Date().toISOString(),last_error:'request_inactive'}).eq('id',job.id);
     skipped++;
     continue;
    }
   }

   const{data:tokens}=await supabase.from('push_tokens').select('id,expo_push_token').eq('user_id',job.user_id).eq('enabled',true);
   if(!tokens?.length){
    await supabase.from('push_outbox').update({sent_at:new Date().toISOString(),last_error:'no_enabled_tokens'}).eq('id',job.id);
    skipped++;
    continue;
   }

   const messages=tokens.map(t=>({to:t.expo_push_token,sound:'default',title:job.title,body:job.body,data:{kind:job.kind,entity_id:job.entity_id,conversation_id:job.conversation_id,route:job.route},priority:job.kind==='beacon'?'high':'default'}));
   const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(messages)});
   const payload=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(`Expo push HTTP ${response.status}`);

   const tickets=Array.isArray(payload?.data)?payload.data:[payload?.data].filter(Boolean);
   let accepted=0;
   for(let i=0;i<tickets.length;i++){
    const ticket=tickets[i];
    if(ticket?.status==='ok'){accepted++;continue}
    const expoError=ticket?.details?.error;
    if(expoError==='DeviceNotRegistered'&&tokens[i]?.id){
     await supabase.from('push_tokens').update({enabled:false,updated_at:new Date().toISOString()}).eq('id',tokens[i].id);
    }
   }
   if(!accepted)throw new Error(tickets.map((t:any)=>t?.message||t?.details?.error).filter(Boolean).join('; ')||'Expo did not accept the push');

   await supabase.from('push_outbox').update({sent_at:new Date().toISOString(),last_error:null}).eq('id',job.id);
   sent++;
  }catch(e:any){
   const attempts=Number(job.attempt_count||0)+1;
   const terminal=attempts>=MAX_ATTEMPTS;
   await supabase.from('push_outbox').update({attempt_count:attempts,last_attempt_at:new Date().toISOString(),last_error:String(e?.message||e).slice(0,500),sent_at:terminal?new Date().toISOString():null}).eq('id',job.id);
   failed++;
  }
 }
 return Response.json({processed:jobs?.length||0,sent,skipped,failed});
});
