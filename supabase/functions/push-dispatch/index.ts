import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'
Deno.serve(async(req)=>{
 const secret=req.headers.get('authorization');
 if(secret!==`Bearer ${Deno.env.get('PUSH_DISPATCH_SECRET')}`)return new Response('Unauthorized',{status:401});
 const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const{data:jobs,error}=await supabase.from('push_outbox').select('*').is('sent_at',null).order('created_at').limit(100);
 if(error)return new Response(error.message,{status:500});
 for(const job of jobs||[]){
  const{data:tokens}=await supabase.from('push_tokens').select('expo_push_token').eq('user_id',job.user_id).eq('enabled',true);
  if(tokens?.length){
   const messages=tokens.map(t=>({to:t.expo_push_token,sound:'default',title:job.title,body:job.body,data:{kind:job.kind,entity_id:job.entity_id,conversation_id:job.conversation_id},priority:job.kind==='beacon'?'high':'default'}));
   await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(messages)});
  }
  await supabase.from('push_outbox').update({sent_at:new Date().toISOString()}).eq('id',job.id);
 }
 return Response.json({processed:jobs?.length||0});
});