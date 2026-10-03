import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';

export const productMailReady = () => Boolean(process.env.PRODUCT_EMAIL_PASS && process.env.PRODUCT_EMAIL_USER === 'info.rajothreads@gmail.com');
export function unsubscribeToken(userId) {
  return jwt.sign({ purpose:'product-email-unsubscribe' }, config.jwtSecret, { subject:String(userId), algorithm:'HS256', issuer:'rajo-api', audience:'rajo-email' });
}
export function readUnsubscribeToken(token) {
  const value = jwt.verify(token,config.jwtSecret,{ algorithms:['HS256'],issuer:'rajo-api',audience:'rajo-email' });
  if(value.purpose !== 'product-email-unsubscribe') throw new Error('Invalid token');
  return value.sub;
}
export async function deliverProductEmail(user, product) {
  const origin = process.env.STORE_PUBLIC_URL || 'https://rajothreads.com';
  const unsubscribe = `${origin}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(user._id))}`;
  const link = `${origin}/product/${product.id}`;
  const text = `Hello ${user.name},\n\nNew at RAJO Threads: ${product.name}\nPrice: INR ${product.price.toLocaleString('en-IN')}\n${product.fabric}\n\nShop now: ${link}\n\nRAJO Threads\nStop new-product emails: ${unsubscribe}`;
  const escape = value => String(value || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const html = `<div style="background:#fffaf2;padding:32px;font-family:Arial;color:#754d3d;max-width:600px;margin:auto"><h1 style="color:#c32643">RAJO THREADS</h1><p>New arrivals, chosen for you.</p>${product.imageUrl?.startsWith('https://') ? `<img src="${escape(product.imageUrl)}" alt="${escape(product.name)}" width="320" style="max-width:100%;height:auto">` : ''}<h2>${escape(product.name)}</h2><p>${escape(product.fabric)}</p><p>INR ${product.price.toLocaleString('en-IN')}</p><p><a href="${escape(link)}" style="display:inline-block;background:#c32643;color:#fffaf2;padding:14px 24px;text-decoration:none">Shop now</a></p><hr><p style="font-size:12px">RAJO Threads · <a href="${escape(unsubscribe)}">Unsubscribe from new-product emails</a></p></div>`;
  const transport = nodemailer.createTransport({ service:'gmail',auth:{user:process.env.PRODUCT_EMAIL_USER,pass:process.env.PRODUCT_EMAIL_PASS},connectionTimeout:8000,socketTimeout:12000 });
  await transport.sendMail({from:'RAJO Threads <info.rajothreads@gmail.com>',to:user.email,subject:`New at RAJO: ${product.name}`,text,html});
}

export async function processProductEmails(db, { send = deliverProductEmail, enabled = productMailReady() } = {}) {
  const jobs = db.collection('productEmailJobs'), products = db.collection('products');
  // Product publication is the durable outbox; interrupted queue creation resumes safely.
  for (const product of await products.find({ notificationRequestedAt:{$exists:true},notificationQueued:{$ne:true},status:'active' }).limit(10).toArray()) {
    const users = db.collection('users').find({role:'customer',status:'active',emailUpdates:{$ne:false},createdAt:{$lte:product.notificationRequestedAt}});
    for await (const user of users) await jobs.updateOne({_id:`${product.id}:${user._id}`},{$setOnInsert:{productId:product.id,userId:user._id,status:'pending',createdAt:new Date(),attempts:0}},{upsert:true});
    await products.updateOne({_id:product._id},{$set:{notificationQueued:true}});
  }
  if(!enabled) return {paused:true,reason:'Gmail App Password is not configured',sent:0};
  const owner=randomUUID(),now=new Date();
  try {
    const lock=await db.collection('emailLocks').findOneAndUpdate({_id:'product-email',expiresAt:{$lte:now}},{$set:{owner,expiresAt:new Date(Date.now()+120000)}},{upsert:true,returnDocument:'after'});
    if(lock?.owner!==owner)return {busy:true,sent:0};
  }catch(e){if(e.code===11000)return {busy:true,sent:0};throw e;}
  let sent=0;
  try {
    // Ambiguous interrupted deliveries need review, never an automatic duplicate send.
    await jobs.updateMany({status:'sending',attemptedAt:{$lt:new Date(Date.now()-120000)}},{$set:{status:'failed',error:'Delivery interrupted; review before retrying.'}});
    for(let i=0;i<4;i++) {
      if(await jobs.countDocuments({attemptedAt:{$gte:new Date(Date.now()-86400000)}})>=100)break;
      const job=await jobs.findOneAndUpdate({status:'pending'},{$set:{status:'sending',attemptedAt:new Date()},$inc:{attempts:1}},{sort:{createdAt:1},returnDocument:'after'});
      if(!job)break;
      const user=await db.collection('users').findOne({_id:job.userId,status:'active',role:'customer',emailUpdates:{$ne:false}});
      const product=await products.findOne({id:job.productId,status:'active'});
      if(!user||!product){await jobs.updateOne({_id:job._id},{$set:{status:'skipped'}});continue;}
      try {await send(user,product);await jobs.updateOne({_id:job._id},{$set:{status:'sent',sentAt:new Date()}});sent++;}
      catch {await jobs.updateOne({_id:job._id},{$set:{status:'failed',error:'Email delivery failed. Check Gmail configuration or sending limits.'}});break;}
    }
    return {sent,paused:false};
  }finally{await db.collection('emailLocks').deleteOne({_id:'product-email',owner});}
}
