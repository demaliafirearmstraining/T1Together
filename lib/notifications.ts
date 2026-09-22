import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {supabase} from './supabase';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:true})});

export async function registerPush(userId:string){
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('default',{name:'T1Together',importance:Notifications.AndroidImportance.HIGH,vibrationPattern:[0,250,150,250]});
 const current=await Notifications.getPermissionsAsync();
 let status=current.status;
 if(status!=='granted')status=(await Notifications.requestPermissionsAsync()).status;
 if(status!=='granted')return {ok:false,reason:'permission'};
 const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
 if(!projectId)return {ok:false,reason:'project'};
 try{
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
  const{error}=await supabase.from('push_tokens').upsert({user_id:userId,expo_push_token:token,platform:Platform.OS,enabled:true,updated_at:new Date().toISOString()},{onConflict:'expo_push_token'});
  return {ok:!error,reason:error?.message,token};
 }catch(e:any){return {ok:false,reason:e?.message||'token'} }
}

export function notificationRoute(data:any){
 if(data?.kind==='help_response'&&data?.entity_id)return {pathname:'/help-responses',params:{id:String(data.entity_id)}} as any;
 if((data?.kind==='help'||data?.kind==='beacon')&&data?.entity_id)return {pathname:'/help-detail',params:{id:String(data.entity_id)}} as any;
 if((data?.kind==='supply'||data?.kind==='supply_match')&&data?.entity_id)return {pathname:'/supply-detail',params:{id:String(data.entity_id)}} as any;
 if(data?.kind==='message'&&data?.conversation_id)return {pathname:'/chat',params:{id:String(data.conversation_id)}} as any;
 if(data?.route)return data.route as any;
 return '/notifications' as any;
}

export async function syncNotificationBadge(){
 const{count,error}=await supabase.from('notifications').select('id',{count:'exact',head:true}).is('read_at',null);
 if(!error)await Notifications.setBadgeCountAsync(count||0).catch(()=>{});
 return count||0;
}
