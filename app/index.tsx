import React,{useEffect,useState}from'react';
import{Redirect,router}from'expo-router';
import{ActivityIndicator,View,Text,Pressable}from'react-native';
import{useAuth}from'../lib/AuthContext';
import{supabase}from'../lib/supabase';
import{C}from'../lib/theme';
export default function Index(){
 const{session,loading}=useAuth();
 const[checking,setChecking]=useState(true);
 const[onboardingComplete,setOnboardingComplete]=useState(false);
 const[failed,setFailed]=useState(false);
 const[retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;
  if(loading)return;
  if(!session){setChecking(false);return}
  setChecking(true);setFailed(false);
  (async()=>{
   try{
    const{data,error}=await supabase.from('profiles').select('id,onboarding_completed').eq('id',session.user.id).maybeSingle();
    if(!active)return;
    if(error){setFailed(true);return}
    setOnboardingComplete(data?.onboarding_completed===true);
   }catch{if(active)setFailed(true)}
   finally{if(active)setChecking(false)}
  })();
  return()=>{active=false};
 },[session?.user?.id,loading,retry]);
 if(loading||checking)return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={C.blue}/></View>;
 if(!session)return <Redirect href="/welcome"/>;
 if(failed)return <View style={{flex:1,justifyContent:'center',padding:24,gap:16}}>
  <Text style={{fontSize:22,fontWeight:'800',color:C.navy}}>Could not load your profile</Text>
  <Text style={{color:C.gray}}>Your saved profile has not been changed. Please try again in a moment.</Text>
  <Pressable accessibilityRole="button" onPress={()=>setRetry(x=>x+1)} style={{padding:16,backgroundColor:C.blue,borderRadius:14}}><Text style={{color:C.white,textAlign:'center',fontWeight:'800'}}>Try Again</Text></Pressable>
  <Pressable accessibilityRole="button" onPress={()=>router.replace('/(tabs)/home')} style={{padding:16}}><Text style={{color:C.blue,textAlign:'center'}}>Go to Home</Text></Pressable>
 </View>;
 return <Redirect href={onboardingComplete?"/(tabs)/home":"/onboarding"}/>;
}
