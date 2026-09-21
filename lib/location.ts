import * as Location from'expo-location';import{supabase}from'./supabase';
export const LOCATION_STALE_HOURS=24;
export async function getApproximateLocationStatus(){
 const{data,error}=await supabase.from('approximate_locations').select('updated_at').maybeSingle();
 return {updatedAt:data?.updated_at||null,error:error?.message};
}
export async function updateApproximateLocation(options:{requestPermission?:boolean}={}){
 const requestPermission=options.requestPermission!==false;
 let p=await Location.getForegroundPermissionsAsync();
 if(p.status!=='granted'&&requestPermission)p=await Location.requestForegroundPermissionsAsync();
 if(p.status!=='granted')return {ok:false,reason:'permission' as const};
 try{
  const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
  const{error}=await supabase.rpc('set_my_approximate_location',{lat:pos.coords.latitude,lng:pos.coords.longitude});
  return {ok:!error,reason:error?.message,updatedAt:error?undefined:new Date().toISOString()};
 }catch(e:any){return {ok:false,reason:e?.message||'location'}}
}
export async function refreshApproximateLocationIfStale(hours=LOCATION_STALE_HOURS){
 const s=await getApproximateLocationStatus();
 const stale=!s.updatedAt||Date.now()-new Date(s.updatedAt).getTime()>hours*3600000;
 if(!stale)return {ok:true,skipped:true,updatedAt:s.updatedAt};
 return updateApproximateLocation({requestPermission:!s.updatedAt});
}