export const WELCOME_SECTIONS=[
 {title:'Community',description:'Say hello, share experiences and ask questions. Reply to conversations, save useful posts, or follow a post for updates.',route:'/(tabs)/community',icon:'people-outline'},
 {title:'Help',description:'Ask for practical guidance or support. Choose Whole community when distance does not matter, or a local audience when it does.',route:'/create-help',icon:'help-buoy-outline'},
 {title:'T1 Beacon',description:'Ask nearby members for time-sensitive practical help. T1 Beacon is peer support and is not an emergency service.',route:'/create-help',mode:'beacon',icon:'radio-outline'},
 {title:'Supply Locker',description:'Offer or request practical supplies. Read the Supply Locker rules and coordinate details privately when you are comfortable.',route:'/supply-locker',icon:'cube-outline'},
 {title:'Groups',description:'Join optional spaces for shared experiences. Group conversations are visible to signed-in members; group membership is optional.',route:'/groups',icon:'chatbubbles-outline'},
] as const;
