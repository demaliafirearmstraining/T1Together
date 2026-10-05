export async function postExpo(messages: unknown[], send: typeof fetch = fetch) {
 return send('https://exp.host/--/api/v2/push/send', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(messages), signal: AbortSignal.timeout(10_000),
 });
}
