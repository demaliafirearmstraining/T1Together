import React from 'react';
import {Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {Screen,Action,ui} from '../components/Screen';
import {WELCOME_SECTIONS} from '../lib/guide';
export default function WelcomeGuide(){
 const{first}=useLocalSearchParams<{first?:string}>();
 return <Screen title="Welcome to T1DReach"><Text style={ui.text}>Your T1D community within reach. Start with a hello, a question, or a conversation that matters to you.</Text>
 <Action label="Introduce myself" onPress={()=>router.replace({pathname:'/create-post',params:{intro:'1'}})}/><Action secondary label="Explore the community" onPress={()=>router.replace('/(tabs)/community')}/>
 {WELCOME_SECTIONS.map(x=><View key={x.title} style={ui.card}><Text accessibilityRole="header" style={ui.heading}>{x.title}</Text><Text style={ui.text}>{x.description}</Text><Action secondary label={`Open ${x.title}`} onPress={()=>router.push({pathname:x.route as any,params:{...('mode' in x?{mode:x.mode}:{})}})}/></View>)}
 <View style={ui.card}><Text accessibilityRole="header" style={ui.heading}>Share at your own pace</Text><Text style={ui.text}>You choose what to post and what appears in your profile. Use Settings to control Nearby discovery, notifications and quiet hours. Account holders must be adults; children are represented by a parent or caregiver.</Text></View>
 <Action secondary label={first?'Skip to Home':'Go to Home'} onPress={()=>router.replace('/(tabs)/home')}/></Screen>;
}
