import { fail, objectId } from '../services/auth.service.js';
import { hasPermission, isOwner } from '../services/admin-access.service.js';
export async function requireAdminAccess(req,res,next) {
 try {
  if(isOwner(req.user)) return next();
  const resource=req.path.split('/')[1];
  if(req.path === '/profile' && ['GET','PATCH'].includes(req.method)) return next();
  let permission=resource==='uploads'?'media':resource==='categories'?'products':resource;
  if(resource==='content') {
   const kinds={banner:'banners',family:'family',blog:'blogs'};
   if(req.method==='GET') {
    req.adminContentKinds=Object.keys(kinds).filter(kind=>hasPermission(req.user,kinds[kind]));
    if(!req.adminContentKinds.length) throw fail(403,'This section is not enabled for your admin account.');
    return next();
   }
   const id=req.path.split('/')[2];
   if(id){
    const old=await req.models.content.findOne({_id:objectId(id)});
    if(!old)throw fail(404,'Record not found.');
    if(!hasPermission(req.user,kinds[old.kind]))throw fail(403,'Access denied.');
    permission=kinds[old.kind];
   }
   if(req.method!=='DELETE')permission=kinds[req.body?.kind];
  }
  if(!hasPermission(req.user,permission))throw fail(403,'This section is not enabled for your admin account.');
  next();
 }catch(error){next(error);}
}
