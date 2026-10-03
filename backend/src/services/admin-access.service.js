export const adminModules = ['overview','products','orders','users','reviews','banners','family','blogs','media','coupons','enquiries','email-queue','settings'];
export const isOwner = user => user?.role === 'admin' && user.email?.toLowerCase() === (process.env.OWNER_EMAIL || 'nishant@gmail.com').toLowerCase();
export const permissionsFor = user => isOwner(user) ? adminModules : (user?.adminPermissions || []).filter(key => adminModules.includes(key));
export const hasPermission = (user,key) => isOwner(user) || permissionsFor(user).includes(key);
