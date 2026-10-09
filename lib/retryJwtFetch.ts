// Retry only a confirmed pre-execution JWT rejection, never an ambiguous write failure.
export function createJwtRetryFetch(
 request: typeof fetch,
 wait: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): typeof fetch {
 return async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!new URL(url).pathname.startsWith('/rest/v1/')) return request(input, init);
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; ; attempt++) {
   const response = await request(typeof Request !== 'undefined' && input instanceof Request ? input.clone() : input, init);
   if (response.status !== 401 || attempt === delays.length) return response;
   const error = await response.clone().json().catch(() => null);
   if (error?.code !== 'PGRST303' || error?.message !== 'JWT issued at future') return response;
   if (init?.signal?.aborted) return response;
   await wait(delays[attempt]);
   if (init?.signal?.aborted) return response;
  }
 };
}
