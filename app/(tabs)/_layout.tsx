import React,{useCallback,useEffect,useState}from'react';import{Tabs,router}from'expo-router';import{Ionicons}from'@expo/vector-icons';import{useAuth}from'../../lib/AuthContext';import{supabase}from'../../lib/supabase';import{C}from'../../lib/theme';

export default function TabsLayout(){
 const{session,loading}=useAuth();
 const[unread,setUnread]=useState(0);const[helpUnread,setHelpUnread]=useState(0);
 useEffect(()=>{if(!loading&&!session)router.replace('/welcome')},[session,loading]);
 const refreshUnread=useCallback(async()=>{if(!session){setUnread(0);setHelpUnread(0);return}const[m,n]=await Promise.all([supabase.rpc('my_unread_conversations'),supabase.rpc('my_unread_notification_count')]);setUnread((m.data||[]).reduce((a:number,x:any)=>a+Number(x.unread_count||0),0));setHelpUnread(Number(n.data||0))},[session]);
 useEffect(()=>{if(!session)return;refreshUnread();const msgChannel=supabase.channel('tab-msg-unread-'+session.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},()=>refreshUnread()).subscribe();const notificationChannel=supabase.channel('tab-help-unread-'+session.user.id).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${session.user.id}`},()=>refreshUnread()).subscribe();const timer=setInterval(refreshUnread,5000);return()=>{clearInterval(timer);supabase.removeChannel(msgChannel);supabase.removeChannel(notificationChannel)}},[session,refreshUnread]);
 if(!session)return null;
 const icons:any={home:'home',nearby:'location',community:'people',help:'help-buoy',messages:'chatbubble'};
 return <Tabs screenListeners={{state:()=>refreshUnread()}} screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:C.blue,tabBarInactiveTintColor:C.gray,tabBarStyle:{height:76,paddingBottom:10,paddingTop:8},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]} size={size} color={color}/>})}>
  <Tabs.Screen name="home" options={{title:'Home'}}/>
  <Tabs.Screen name="nearby" options={{title:'Nearby'}}/>
  <Tabs.Screen name="community" options={{title:'Community'}}/>
  <Tabs.Screen name="help" options={{title:'Help',tabBarBadge:helpUnread>0?(helpUnread>99?'99+':helpUnread):undefined,tabBarBadgeStyle:{backgroundColor:C.red,color:C.white,fontWeight:'900'}}}/>
  <Tabs.Screen name="messages" options={{title:'Messages',tabBarBadge:unread>0?(unread>99?'99+':unread):undefined,tabBarBadgeStyle:{backgroundColor:C.red,color:C.white,fontWeight:'900'}}}/>
 </Tabs>
}