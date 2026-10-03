import { z } from 'zod';
import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { fail, objectId } from '../services/auth.service.js';
import { processProductEmails, productMailReady, readUnsubscribeToken } from '../services/product-email.service.js';
const router=Router();
router.get('/internal/product-emails',async(req,res)=>{
  const expected=process.env.EMAIL_QUEUE_SECRET;
  const actual=req.headers.authorization?.replace(/^Bearer /,'') || '';
  if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))throw fail(401,'Unauthorized');
  res.json(await processProductEmails(req.db));
});
router.get('/admin/email-queue',async(req,res)=>{
  const counts=await req.db.collection('productEmailJobs').aggregate([{$group:{_id:'$status',count:{$sum:1}}}]).toArray();
  const items=await req.db.collection('productEmailJobs').find({}).sort({createdAt:-1}).limit(100).toArray();
  const settings=await req.db.collection('settings').findOne({_id:'store'});
  res.json({enabled:settings?.productEmailsEnabled!==false,ready:productMailReady(),sender:'info.rajothreads@gmail.com',counts,items});
});
router.patch('/admin/email-queue',async(req,res)=>{
 const {enabled}=z.object({enabled:z.boolean()}).parse(req.body);
 await req.db.collection('settings').updateOne({_id:'store'},{$set:{productEmailsEnabled:enabled}},{upsert:true});
 res.json({enabled});
});
router.get('/email/unsubscribe',(req,res)=>{
  try{readUnsubscribeToken(req.query.token);}catch{throw fail(400,'Invalid unsubscribe link.');}
  res.type('html').send('<!doctype html><meta name="viewport" content="width=device-width"><title>RAJO email preferences</title><main style="max-width:500px;margin:80px auto;padding:24px;font-family:Arial;background:#fffaf2;color:#9e3044"><h1>Email preferences</h1><p>Stop receiving new-product emails from RAJO Threads.</p><button id="stop">Unsubscribe</button><p id="result"></p></main><script>document.getElementById("stop").onclick=async function(){this.disabled=true;try{const r=await fetch(location.href,{method:"POST",headers:{"X-Requested-With":"RajoStore"}});document.getElementById("result").textContent=r.ok?"You have been unsubscribed.":"Unable to update preferences. Please try again.";}catch{document.getElementById("result").textContent="Connection failed. Please try again.";this.disabled=false;}}</script>');
});
router.post('/email/unsubscribe',async(req,res)=>{
  let id;try{id=readUnsubscribeToken(req.query.token);}catch{throw fail(400,'Invalid unsubscribe link.');}
  await req.models.users.updateOne({_id:objectId(id)},{$set:{emailUpdates:false}});
  res.json({ok:true});
});
export default router;
