import {SafeAreaProvider} from 'react-native-safe-area-context';import {AppState} from 'react-native';
import React,{useEffect}from'react';import{Stack,router}from'expo-router';import * as Notifications from'expo-notifications';import{AuthProvider,useAuth}from'../lib/AuthContext';import{registerPush,notificationRoute,syncNotificationBadge}from'../lib/notifications';import{refreshApproximateLocationIfStale}from'../lib/location';

function NotificationBridge(){
 const{session}=useAuth();
 useEffect(()=>{
  if(session?.user?.id){
   registerPush(session.user.id).then(result=>{if(!result.ok)console.warn('Push registration failed:',result.reason)});
   refreshApproximateLocationIfStale().catch(()=>{});
   syncNotificationBadge().catch(()=>{});
   const listener=AppState.addEventListener('change',state=>{if(state==='active'){registerPush(session.user.id,false).then(result=>{if(!result.ok)console.warn('Push registration failed:',result.reason)});syncNotificationBadge().catch(()=>{});}});
   return()=>listener.remove();
  }else{
   Notifications.setBadgeCountAsync(0).catch(()=>{});
  }
 },[session?.user?.id]);

 useEffect(()=>{
  const open=(r:Notifications.NotificationResponse)=>{
   const data=r.notification.request.content.data;
   router.push(notificationRoute(data));
   syncNotificationBadge().catch(()=>{});
  };
  const responseSub=Notifications.addNotificationResponseReceivedListener(open);
  const receiveSub=Notifications.addNotificationReceivedListener(()=>syncNotificationBadge().catch(()=>{}));
  Notifications.getLastNotificationResponseAsync().then(r=>{if(r)open(r)});
  return()=>{responseSub.remove();receiveSub.remove()};
 },[]);
 return null;
}

export default function Layout(){return <SafeAreaProvider><AuthProvider><NotificationBridge/><Stack screenOptions={{headerShown:false}}/></AuthProvider></SafeAreaProvider>}
