import * as Location from'expo-location';import{supabase}from'./supabase';
export async function updateApproximateLocation(){
 const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')return {ok:false,reason:'permission'};
 const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
 const{error}=await supabase.rpc('set_my_approximate_location',{lat:pos.coords.latitude,lng:pos.coords.longitude});
 return {ok:!error,reason:error?.message};
}