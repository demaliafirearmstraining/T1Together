import React,{useState}from'react';
import{SafeAreaView,View,Text,Pressable,StyleSheet,Alert,ActivityIndicator}from'react-native';
import{router}from'expo-router';
import{Ionicons}from'@expo/vector-icons';
import{supabase}from'../lib/supabase';
import{useAuth}from'../lib/AuthContext';
import{C}from'../lib/theme';

export default function Account(){
 const{session,signOut}=useAuth();
 const[busy,setBusy]=useState(false);
 async function logout(){if(busy)return;setBusy(true);try{await signOut();router.replace('/welcome')}finally{setBusy(false)}}
 function deleteAccount(){
  if(!session||busy)return;
  Alert.alert('Delete T1Together Account?','This permanently deletes your profile, posts, comments, Help and Supply Locker activity, messages tied to your account, location data, push tokens and uploaded photos. This cannot be undone.',[
   {text:'Cancel',style:'cancel'},
   {text:'Continue',style:'destructive',onPress:()=>Alert.alert('Are you absolutely sure?','Your T1Together account and app data will be permanently deleted.',[
    {text:'Cancel',style:'cancel'},
    {text:'Delete My Account',style:'destructive',onPress:async()=>{setBusy(true);const{error}=await supabase.functions.invoke('delete-account',{body:{confirm:true}});if(error){setBusy(false);return Alert.alert('Could not delete account',error.message)}await signOut();router.replace('/welcome')}}
   ])}
  ]);
 }
 return <SafeAreaView style={s.safe}><View style={s.page}>
  <View style={s.header}><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-back" size={24} color={C.blue}/><Text style={s.backText}>Back</Text></Pressable><Text style={s.title}>Account</Text><View style={{width:72}}/></View>
  <View style={s.card}><View style={s.icon}><Ionicons name="person-circle-outline" size={25} color={C.blue}/></View><View style={{flex:1}}><Text style={s.cardTitle}>Signed in as</Text><Text style={s.email}>{session?.user?.email||'T1Together member'}</Text></View></View>
  <Pressable style={s.settings} onPress={()=>router.push('/settings')}><Ionicons name="settings-outline" size={21} color={C.blue}/><View style={{flex:1}}><Text style={s.settingsTitle}>Profile & Settings</Text><Text style={s.settingsText}>Profile, experience, privacy, alerts and blocked members</Text></View><Ionicons name="chevron-forward" size={19} color={C.gray}/></Pressable>
  <Pressable style={[s.signOut,busy&&s.disabled]} onPress={logout} disabled={busy}><Ionicons name="log-out-outline" size={21} color={C.blue}/><Text style={s.signOutText}>Sign Out</Text>{busy&&<ActivityIndicator size="small" color={C.blue}/>}</Pressable>
  <View style={s.danger}><Text style={s.dangerTitle}>Delete Account</Text><Text style={s.dangerText}>Permanently delete your T1Together account and associated app data. This cannot be undone.</Text><Pressable style={[s.delete,busy&&s.disabled]} onPress={deleteAccount} disabled={busy}><Ionicons name="trash-outline" size={20} color={C.red}/><Text style={s.deleteText}>Delete My Account</Text></Pressable></View>
  <Pressable style={s.legal} onPress={()=>router.push('/legal-support')}><Ionicons name="shield-checkmark-outline" size={20} color={C.blue}/><Text style={s.legalText}>Legal, Safety & Support</Text><Ionicons name="chevron-forward" size={18} color={C.gray}/></Pressable>
 </View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.white},page:{flex:1,padding:20},header:{height:52,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:20},back:{width:72,minHeight:44,flexDirection:'row',alignItems:'center'},backText:{color:C.blue,fontWeight:'800'},title:{fontSize:19,fontWeight:'900',color:C.navy},card:{flexDirection:'row',alignItems:'center',gap:12,padding:16,borderWidth:1,borderColor:C.line,borderRadius:17},icon:{width:44,height:44,borderRadius:22,backgroundColor:C.sky,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:13,fontWeight:'900',color:C.navy},email:{fontSize:13,color:C.gray,marginTop:3},settings:{flexDirection:'row',alignItems:'center',gap:11,padding:16,borderWidth:1,borderColor:C.line,borderRadius:17,marginTop:12},settingsTitle:{fontWeight:'900',color:C.navy},settingsText:{fontSize:12,color:C.gray,marginTop:3},signOut:{height:54,borderRadius:15,borderWidth:2,borderColor:C.blue,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',marginTop:20},signOutText:{color:C.blue,fontWeight:'900',fontSize:16},danger:{padding:17,borderRadius:17,backgroundColor:'#FFF4F3',borderWidth:1,borderColor:'#F4B5B0',marginTop:18},dangerTitle:{fontSize:17,fontWeight:'900',color:C.red},dangerText:{fontSize:13,lineHeight:19,color:C.gray,marginTop:5},delete:{height:50,borderRadius:13,borderWidth:2,borderColor:C.red,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',marginTop:14,backgroundColor:C.white},deleteText:{color:C.red,fontWeight:'900',fontSize:15},legal:{height:52,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:14,borderRadius:15,backgroundColor:C.pale,marginTop:18},legalText:{flex:1,color:C.navy,fontWeight:'800'},disabled:{opacity:.5}});