import {supabase} from './supabase';

export async function myHelpResponses(userId:string,requests:{id:string}[]){
 const ids=[...new Set(requests.map(x=>x.id))];
 const result:Record<string,boolean>={};
 // One row per (request,responder), so a batch cannot hit the API row ceiling.
 // Limit URL length and read only responses needed by the current request list.
 for(let offset=0;offset<ids.length;offset+=100){
  const{data,error}=await supabase.from('beacon_responses').select('request_id').eq('responder_id',userId).in('request_id',ids.slice(offset,offset+100));
  if(error)throw error;
  for(const row of data||[])result[row.request_id]=true;
 }
 return result;
}
