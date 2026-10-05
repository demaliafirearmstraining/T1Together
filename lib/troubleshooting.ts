export function permissionDescription(permission:any){
 // iOS provisional permission permits quiet delivery to Notification Center.
 if(permission?.ios?.status===3)return 'Quiet delivery allowed (provisional)';
 if(permission?.granted)return 'Allowed';
 if(permission?.status==='denied')return 'Blocked in phone settings';
 return 'Not yet enabled';
}
export function diagnosticSummary(info:{version:string;build:string;platform:string;permission:string;connection:string;timezone:string}){
 return ['T1DReach troubleshooting',`App version: ${info.version}`,`Build: ${info.build}`,`Device: ${info.platform}`,`Notifications: ${info.permission}`,`Connection: ${info.connection}`,`Time zone: ${info.timezone}`].join('\n');
}
