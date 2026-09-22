import React,{useEffect}from'react';import{Stack,router}from'expo-router';import * as Notifications from'expo-notifications';import{AuthProvider,useAuth}from'../lib/AuthContext';import{registerPush,notificationRoute,syncNotificationBadge}from'../lib/notifications';import{refreshApproximateLocationIfStale}from'../lib/location';

function NotificationBridge(){
 const{session}=useAuth();
 useEffect(()=>{
  if(session?.user?.id){
   registerPush(session.user.id);
   refreshApproximateLocationIfStale().catch(()=>{});
   syncNotificationBadge().catch(()=>{});
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

export default function Layout(){return <AuthProvider><NotificationBridge/><Stack screenOptions={{headerShown:false}}/></AuthProvider>}
