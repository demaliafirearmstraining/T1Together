// Drain the first page after each removal so pagination cannot skip remaining objects.
export async function removeUserStorage(admin: any, userId: string, deadline = Date.now() + 40_000) {
 if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('Invalid account storage prefix');
 let batches = 0;
 async function drain(bucket: string, prefix: string, depth: number): Promise<void> {
  if (depth > 8) throw new Error('Account storage nesting exceeds cleanup limit');
  for (;;) {
   if (Date.now() >= deadline || ++batches > 1000) throw new Error('Storage cleanup incomplete; retry account deletion');
   const {data, error} = await admin.storage.from(bucket).list(prefix, {limit: 100, offset: 0, sortBy: {column: 'name', order: 'asc'}});
   if (error) throw new Error(`Could not list account storage: ${error.message}`);
   if (!data?.length) return;
   const paths: string[] = [];
   for (const item of data) {
    if (!item.name || item.name.includes('/') || item.name === '..' || item.name === '.') throw new Error('Unexpected storage object name');
    const path = `${prefix}/${item.name}`;
    if (item.id == null) await drain(bucket, path, depth + 1);
    else paths.push(path);
   }
   if (paths.length) {
    const {error: removeError} = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw new Error(`Could not remove account storage: ${removeError.message}`);
   }
  }
 }
 for (const bucket of ['avatars', 'community-posts']) await drain(bucket, userId, 0);
}
