import React from 'react';
import {SafeAreaView,View,Text,StyleSheet} from 'react-native';
import {C} from '../../lib/theme';

export default function Home(){
  return <SafeAreaView style={s.safe}>
    <View style={s.page}>
      <Text style={s.eyebrow}>T1TOGETHER</Text>
      <Text style={s.h}>You're in. 💙</Text>
      <Text style={s.sub}>Your T1D community starts here. Nearby people, community posts, help requests, and messages will live in these tabs.</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Welcome to T1Together</Text>
        <Text style={s.cardText}>Life with Type 1, together.</Text>
      </View>
    </View>
  </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.white},
 page:{flex:1,padding:24,paddingTop:48},
 eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1.5,color:C.blue},
 h:{fontSize:34,fontWeight:'900',color:C.navy,marginTop:8},
 sub:{fontSize:17,lineHeight:25,color:C.gray,marginTop:10},
 card:{marginTop:28,padding:20,borderRadius:20,backgroundColor:C.pale},
 cardTitle:{fontSize:19,fontWeight:'900',color:C.navy},
 cardText:{fontSize:16,color:C.gray,marginTop:5}
});