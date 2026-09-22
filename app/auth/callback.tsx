import React,{useEffect,useState}from'react';import{SafeAreaView,View,Text,ActivityIndicator,StyleSheet,Pressable}from'react-native';import * as Linking from'expo-linking';import{router}from'expo-router';import{consumeAuthUrl}from'../../lib/authLinks';import{C}from'../../lib/theme';

export default function AuthCallback(){
 const[error,setError]=useState('');
 useEffect(()=>{(async()=>{
  try{
   const url=await Linking.getInitialURL();
   if(!url)throw new Error('The sign-in link is missing.');
   const r=await consumeAuthUrl(url);
   router.replace(r.recovery?'/reset-password':'/');
  }catch(e:any){setError(e?.message||'This link could not be completed.')}
 })()},[]);
 return <SafeAreaView style={s.safe}><View style={s.wrap}>{error?<><Text style={s.h}>Link Problem</Text><Text style={s.copy}>{error}</Text><Pressable style={s.btn} onPress={()=>router.replace('/sign-in')}><Text style={s.bt}>Back to Sign In</Text></Pressable></>:<><ActivityIndicator color={C.blue} size="large"/><Text style={s.h}>Finishing up…</Text><Text style={s.copy}>T1Together is securely completing your account request.</Text></>}</View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},wrap:{flex:1,justifyContent:'center',padding:28,alignItems:'center'},h:{fontSize:27,fontWeight:'900',color:C.navy,marginTop:18,textAlign:'center'},copy:{fontSize:15,lineHeight:22,color:C.gray,textAlign:'center',marginTop:8},btn:{backgroundColor:C.blue,borderRadius:15,paddingHorizontal:24,paddingVertical:15,marginTop:22},bt:{color:C.white,fontWeight:'900'}});
