import React,{useState}from'react';import{SafeAreaView,View,Text,TextInput,Pressable,StyleSheet,Alert,KeyboardAvoidingView,Platform}from'react-native';import{router}from'expo-router';import{supabase}from'../lib/supabase';import{C}from'../lib/theme';

export default function ResetPassword(){
 const[pw,setPw]=useState('');const[again,setAgain]=useState('');const[busy,setBusy]=useState(false);
 async function save(){
  if(pw.length<8)return Alert.alert('Password too short','Use at least 8 characters.');
  if(pw!==again)return Alert.alert('Passwords do not match','Enter the same password twice.');
  setBusy(true);const{error}=await supabase.auth.updateUser({password:pw});setBusy(false);
  if(error)return Alert.alert('Could not update password',error.message);
  Alert.alert('Password Updated','Your new password is ready.',[{text:'Continue',onPress:()=>router.replace('/')}]);
 }
 return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.wrap} behavior={Platform.OS==='ios'?'padding':undefined}><Text style={s.h}>Choose a New Password</Text><Text style={s.sub}>Enter a new password for your T1Together account.</Text><TextInput style={s.input} placeholder="New password (8+ characters)" secureTextEntry value={pw} onChangeText={setPw}/><TextInput style={s.input} placeholder="Confirm new password" secureTextEntry value={again} onChangeText={setAgain}/><Pressable style={[s.btn,busy&&{opacity:.6}]} onPress={save} disabled={busy}><Text style={s.bt}>{busy?'Updating…':'Update Password'}</Text></Pressable></KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},wrap:{flex:1,justifyContent:'center',padding:24},h:{fontSize:30,fontWeight:'900',color:C.navy},sub:{fontSize:16,color:C.gray,marginTop:6,marginBottom:25},input:{borderWidth:1,borderColor:C.line,borderRadius:14,padding:15,fontSize:16,marginBottom:12},btn:{backgroundColor:C.blue,borderRadius:15,padding:16,alignItems:'center',marginTop:6},bt:{color:C.white,fontWeight:'900',fontSize:16}});
