process.env.JWT_SECRET = "isolated-test-jwt-secret-at-least-32-characters";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash, createHmac } from "node:crypto";
import { createReadStream } from "node:fs";
import memoryUtils from "mongodb-memory-server-core/lib/util/utils.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
process.env.NODE_ENV = "test";
process.env.ADMIN_EMAIL = "owner@example.com";
process.env.OWNER_EMAIL = "owner@example.com";
process.env.REQUIRE_EMAIL_VERIFICATION = "true";
process.env.APP_URL = "http://localhost:5173";
for (const key of ['R2_GATEWAY_URL','R2_GATEWAY_TOKEN','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_PUBLIC_URL','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_IMAGES_API_TOKEN','BLOB_READ_WRITE_TOKEN']) process.env[key] = '';
delete process.env.VERCEL;
// Keep the upstream download checksum verification, but stream the large Windows archive.
memoryUtils.md5FromFile = async (file) => {
  const checksum = createHash("md5");
  for await (const chunk of createReadStream(file)) checksum.update(chunk);
  return checksum.digest("hex");
};
const { createApp } = await import("../src/app.js");
const { createIndexes } = await import("../src/config/database.js");
const { hash } = await import("../src/services/auth.service.js");
const { config } = await import("../src/config/env.js");
let repl, client, db, app, owner, customer, other;
const codes = new Map();
test('Razorpay test checkout verifies amounts signatures ownership and duplicate callbacks',async()=>{
 const {encryptPaymentSecret}=await import('../src/services/razorpay-config.service.js');
 const secret='isolated-payment-secret',settings=await db.collection('settings').findOne({_id:'store'});
 await db.collection('paymentConfig').insertOne({_id:'razorpay',keyId:'rzp_test_isolated',encryptedSecret:encryptPaymentSecret(secret),enabled:true});
 await db.collection('settings').updateOne({_id:'store'},{$set:{codEnabled:false,codFee:35,shippingMode:'paid',shippingFee:50}});
 const remotes=new Map(),payments=new Map();let counter=0;
 const gatewayApp=createApp({getConnection:async()=>({client,db}),razorpayRequest:async(c,path,method,body)=>{
  assert.equal(c.keyId,'rzp_test_isolated');
  if(path==='/orders'&&method==='POST'){const r={...body,id:'order_test'+(++counter)};remotes.set(r.id,r);return r;}
  if(path.startsWith('/orders/')&&path.endsWith('/payments'))return {items:[...payments.values()].filter(p=>path.includes(p.order_id))};
  if(path.endsWith('/capture')){const p=payments.get(path.split('/')[2]);p.status='captured';return p;}
  if(path.startsWith('/payments/'))return payments.get(path.split('/')[2]);
  throw Error('Unexpected gateway call');
 }});
 const p=await product(5),items=[{productId:p.id,qty:1,size:''}],keys=[];
 const call=(path,key,body)=>mutation(request(gatewayApp),'post','/api/checkout/guest/razorpay/'+path,body).set('Idempotency-Key',key);
 const make=async()=>{const key=randomUUID();keys.push(key);const r=await call('create',key,{items,address:shipping,total:1}).expect(200);return {key,data:r.body};};
 const verification=(data,id)=>({attemptId:data.attemptId,razorpay_order_id:data.razorpayOrderId,razorpay_payment_id:id,razorpay_signature:createHmac('sha256',secret).update(data.razorpayOrderId+'|'+id).digest('hex')});
 try{
  const quote=await mutation(request(gatewayApp),'post','/api/checkout/guest/quote',{items}).expect(200);assert.equal(quote.body.onlineEnabled,true);assert.equal(quote.body.codEnabled,false);
  const configResponse=await owner.get('/api/admin/payment-gateway').expect(200);assert.equal(configResponse.body.hasSecret,true);assert.ok(!JSON.stringify(configResponse.body).includes(secret));
  assert.ok(!JSON.stringify((await request(app).get('/api/settings')).body).includes('encryptedSecret'));
  await customer.get('/api/admin/payment-gateway').expect(403);
  const {key,data}=await make();assert.equal(data.amount,105000);assert.ok(!('encryptedSecret' in data));
  assert.equal((await call('create',key,{items,address:shipping,total:1}).expect(200)).body.razorpayOrderId,data.razorpayOrderId);assert.equal(counter,1);
  await call('status',randomUUID(),{attemptId:data.attemptId}).expect(404);
  assert.equal((await call('status',key,{attemptId:data.attemptId}).expect(200)).body.order,null);
  const id='pay_success';payments.set(id,{id,order_id:data.razorpayOrderId,amount:105000,currency:'INR',status:'authorized'});
  await call('verify',key,{...verification(data,id),razorpay_signature:'0'.repeat(64)}).expect(400);
  payments.get(id).amount=100;await call('verify',key,verification(data,id)).expect(400);payments.get(id).amount=105000;
  payments.get(id).status='failed';await call('verify',key,verification(data,id)).expect(409);payments.get(id).status='authorized';
  const confirmed=await call('verify',key,verification(data,id)).expect(200);assert.equal(confirmed.body.order.paymentStatus,'paid');assert.equal(confirmed.body.order.paymentMethod,'razorpay');assert.equal(confirmed.body.order.codFee,0);
  await call('verify',key,verification(data,id)).expect(200);assert.equal((await db.collection('products').findOne({id:p.id})).stock,4);
  const recovery=await make();payments.set('pay_recovery',{id:'pay_recovery',order_id:recovery.data.razorpayOrderId,amount:105000,currency:'INR',status:'captured'});
  assert.equal((await call('status',recovery.key,{attemptId:recovery.data.attemptId}).expect(200)).body.order.paymentStatus,'paid');
  const missing=await make();await db.collection('products').updateOne({id:p.id},{$set:{stock:0}});payments.set('pay_missing',{id:'pay_missing',order_id:missing.data.razorpayOrderId,amount:105000,currency:'INR',status:'captured'});
  const review=await call('verify',missing.key,verification(missing.data,'pay_missing')).expect(200);assert.equal(review.body.order.paymentStatus,'refund_pending');assert.equal(review.body.order.status,'cancelled');assert.equal((await db.collection('products').findOne({id:p.id})).stock,0);
  await db.collection('products').updateOne({id:p.id},{$set:{stock:2}});
  const signed=request.agent(gatewayApp);await mutation(signed,'post','/api/auth/login',{email:'customer@example.com',password:pass}).expect(200);
  const signedKey=randomUUID();const start=await mutation(signed,'post','/api/checkout/razorpay/create',{items,address:shipping}).set('Idempotency-Key',signedKey).expect(200);
  await call('status',signedKey,{attemptId:start.body.attemptId}).expect(404);
  payments.set('pay_signed',{id:'pay_signed',order_id:start.body.razorpayOrderId,amount:105000,currency:'INR',status:'captured'});
  const signedResult=await mutation(signed,'post','/api/checkout/razorpay/verify',verification(start.body,'pay_signed')).set('Idempotency-Key',signedKey).expect(200);assert.equal(signedResult.body.order.guest,false);
 }finally{
  const attempts=await db.collection('paymentAttempts').find({keyId:'rzp_test_isolated'}).toArray();
  await db.collection('orders').deleteMany({idempotencyKey:{$in:attempts.map(a=>'rzp_'+a._id)}});await db.collection('paymentAttempts').deleteMany({keyId:'rzp_test_isolated'});await db.collection('paymentConfig').deleteOne({_id:'razorpay'});await db.collection('settings').replaceOne({_id:'store'},settings);await db.collection('products').deleteOne({id:p.id});
 }
});
test('dashboard excludes deleted records from counts totals lists and charts',async()=>{
 const baseline=(await owner.get('/api/admin/overview').expect(200)).body;
 const inserted=[];
 try{
  for(const marker of [{deletedAt:new Date()},{deletedBy:'test-admin'},{status:'deleted'}]){
   for(const [collection,record] of [
    ['orders',{number:randomUUID(),idempotencyKey:randomUUID(),status:'placed',paymentStatus:'paid',total:99999,createdAt:new Date()}],
    ['products',{id:Math.floor(Math.random()*1000000000)+1000000,sku:randomUUID(),name:'Deleted dashboard product',status:'active',stock:1,category:'Deleted category'}],
    ['users',{email:randomUUID()+'@example.com',role:'customer',status:'active'}],
    ['reviews',{status:'pending',productId:randomUUID(),userId:randomUUID()}]
   ]){const result=await db.collection(collection).insertOne({...record,...marker});inserted.push([collection,result.insertedId]);}
  }
  assert.deepEqual((await owner.get('/api/admin/overview').expect(200)).body,baseline);
 }finally{for(const [collection,_id] of inserted)await db.collection(collection).deleteOne({_id});}
});
test('admin can edit own profile without changing access or another account',async()=>{
 const {passwordHash}=await import('../src/services/auth.service.js');
 const pass='ProfileTest123!';const inserted=await db.collection('users').insertOne({name:'Profile admin',email:'profile-admin@example.com',password:await passwordHash(pass),role:'admin',status:'active',emailVerified:true,adminPermissions:[]});
 const agent=request.agent(app).set('X-Session-Scope','admin');
 try{
  await mutation(agent,'post','/api/auth/login',{email:'profile-admin@example.com',password:pass,scope:'admin'}).expect(200);
  await agent.get('/api/admin/profile').expect(200);
  await mutation(agent,'patch','/api/admin/profile',{name:'Updated admin',phone:'9876501234'}).expect(200);
  const saved=await db.collection('users').findOne({_id:inserted.insertedId});assert.equal(saved.name,'Updated admin');assert.equal(saved.loginPhone,'9876501234');assert.deepEqual(saved.adminPermissions,[]);
  await mutation(agent,'patch','/api/admin/profile',{name:'Other',phone:'',role:'admin',adminPermissions:['users']}).expect(400);
  await mutation(customer,'patch','/api/admin/profile',{name:'No access',phone:''}).expect(403);
  await agent.get('/api/admin/users').expect(403);
 }finally{await db.collection('sessions').deleteMany({userId:inserted.insertedId});await db.collection('users').deleteOne({_id:inserted.insertedId});}
});
test('category deletion protects products and new arrival selection persists',async()=>{
 const name='Test Delete Category',slug='test-delete-category';
 await mutation(owner,'post','/api/admin/categories',{name}).expect(201);
 await mutation(customer,'delete','/api/admin/categories/'+slug).expect(403);
 const p=await product();
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,category:name,isNewArrival:true}).expect(200);
 assert.equal((await request(app).get('/api/products/'+p.id)).body.isNewArrival,true);
 await mutation(owner,'delete','/api/admin/categories/'+slug).expect(409);
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,isNewArrival:false}).expect(200);
 assert.equal((await request(app).get('/api/products/'+p.id)).body.isNewArrival,false);
 await mutation(owner,'delete','/api/admin/categories/'+slug).expect(200);
 assert.ok(!(await owner.get('/api/admin/categories')).body.items.some(c=>c.slug===slug));
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,category:name}).expect(400);
 await mutation(owner,'post','/api/admin/categories',{name}).expect(201);
 assert.ok((await owner.get('/api/admin/categories')).body.items.some(c=>c.slug===slug));
 await db.collection('products').deleteOne({id:p.id});await db.collection('categories').deleteOne({_id:slug});
});
test('product image galleries persist, validate limits and preserve legacy edits',async()=>{
 const p=await product();const photos=['https://example.com/front.jpg','https://example.com/back.jpg'];
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,imageUrls:photos}).expect(200);
 let saved=(await request(app).get('/api/products/'+p.id)).body;
 assert.deepEqual(saved.imageUrls,photos);assert.equal(saved.imageUrl,photos[0]);
 const {imageUrls,...legacy}=saved;
 await mutation(owner,'put','/api/admin/products/'+p.id,{...legacy,name:'Updated legacy product'}).expect(200);
 assert.deepEqual((await request(app).get('/api/products/'+p.id)).body.imageUrls,photos);
 for(const bad of [[...photos,photos[0]],['javascript:alert(1)'],[''],Array.from({length:9},(_,i)=>'https://example.com/'+i+'.jpg')]) await mutation(owner,'put','/api/admin/products/'+p.id,{...p,imageUrls:bad}).expect(400);
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,imageUrls:[photos[1],photos[0]]}).expect(200);
 assert.equal((await request(app).get('/api/products/'+p.id)).body.imageUrl,photos[1]);
 await mutation(owner,'put','/api/admin/products/'+p.id,{...p,imageUrls:[]}).expect(200);
 saved=(await request(app).get('/api/products/'+p.id)).body;assert.deepEqual(saved.imageUrls,[]);assert.equal(saved.imageUrl,'');
 await db.collection('products').deleteOne({id:p.id});
});
test('admin order deletion hides both order and payment entries while preserving history and stock', async () => {
 const p=await product(10);
 const response=await mutation(customer,'post','/api/orders',{items:[{productId:p.id,qty:1,size:''}],address:shipping}).set('Idempotency-Key',randomUUID()).expect(201);
 const id=response.body._id;
 await mutation(request(app),'delete','/api/admin/orders/'+id).expect(401);
 await mutation(customer,'delete','/api/admin/orders/'+id).expect(403);
 const before=await db.collection('orders').findOne({number:response.body.number});
 await mutation(owner,'delete','/api/admin/orders/'+id).expect(200);
 assert.ok(!(await owner.get('/api/admin/orders')).body.items.some(o=>o._id===id));
 assert.ok(!(await owner.get('/api/admin/orders?view=payments')).body.items.some(o=>o._id===id));
 assert.ok((await customer.get('/api/orders')).body.items.some(o=>o._id===id));
 const deleted=await db.collection('orders').findOne({_id:before._id});
 assert.ok(deleted.deletedAt);assert.ok(deleted.deletedBy);
 assert.equal(deleted.status,before.status);assert.equal(deleted.paymentStatus,before.paymentStatus);assert.equal(deleted.total,before.total);
 assert.equal((await db.collection('products').findOne({id:p.id})).stock,9);
 await mutation(owner,'delete','/api/admin/orders/'+id).expect(200);
 assert.equal((await db.collection('orders').findOne({_id:before._id})).deletedAt.getTime(),deleted.deletedAt.getTime());
 await mutation(owner,'delete','/api/admin/orders/not-an-id').expect(400);
 await mutation(owner,'delete','/api/admin/orders/000000000000000000000001').expect(404);
 await db.collection('orders').deleteOne({_id:before._id});await db.collection('products').deleteOne({id:p.id});
});
test('admins add unique categories and custom sizes are enforced in cart and checkout',async()=>{
 await mutation(customer,'post','/api/admin/categories',{name:'Dresses'}).expect(403);
 await mutation(owner,'post','/api/admin/categories',{name:'Dresses'}).expect(201);
 await mutation(owner,'post','/api/admin/categories',{name:'dresses'}).expect(409);
 await mutation(owner,'post','/api/admin/categories',{name:'All styles'}).expect(409);
 assert.ok((await owner.get('/api/admin/categories')).body.items.some(c=>c.name==='Dresses'));
 const p=await product();
 try{
  await mutation(owner,'put','/api/admin/products/'+p.id,{...p,category:'Unknown category',sizes:['Small']}).expect(400);
  await mutation(owner,'put','/api/admin/products/'+p.id,{...p,category:'Dresses',sizes:['Small','Medium'],status:'draft'}).expect(200);
  await db.collection('products').updateOne({id:p.id},{$set:{status:'active'}});
  assert.ok((await request(app).get('/api/products')).body.categories.some(c=>c.slug==='dresses'));
  await mutation(customer,'put','/api/cart',{items:[{productId:p.id,qty:1,size:'Large'}]}).expect(400);
  await mutation(customer,'put','/api/cart',{items:[{productId:p.id,qty:1,size:'Medium'}]}).expect(200);
  await mutation(request(app),'post','/api/checkout/guest/quote',{items:[{productId:p.id,qty:1,size:''}]}).expect(400);
  const quote=await mutation(request(app),'post','/api/checkout/guest/quote',{items:[{productId:p.id,qty:1,size:'Small'}]}).expect(200);
  assert.equal(quote.body.items[0].size,'Small');
 }finally{await db.collection('products').deleteOne({id:p.id});await mutation(customer,'put','/api/cart',{items:[]}).expect(200);}
});
test('admin notification switch pauses and resumes pending deliveries',async()=>{
 const {processProductEmails}=await import('../src/services/product-email.service.js');
 const p=await product();
 await db.collection('products').updateOne({id:p.id},{$set:{notificationRequestedAt:new Date()}});
 await mutation(owner,'patch','/api/admin/email-queue',{enabled:false}).expect(200);
 const result=await processProductEmails(db,{enabled:true,send:async()=>assert.fail('Disabled notifications must not send')});
 assert.equal(result.paused,true);
 assert.equal((await owner.get('/api/admin/email-queue')).body.enabled,false);
 await mutation(owner,'patch','/api/admin/email-queue',{enabled:true}).expect(200);
 const emails=[];await processProductEmails(db,{enabled:true,send:async u=>emails.push(u.email)});
 assert.equal(emails.length,2);
 await mutation(customer,'patch','/api/admin/email-queue',{enabled:false}).expect(403);
});
test('restricted administrators cannot bypass modules, change other admins or escalate their own role',async()=>{
 const agent=request.agent(app).set('X-Session-Scope','admin');
 const {passwordHash}=await import('../src/services/auth.service.js');
 const result=await db.collection('users').insertOne({email:'restricted@example.com',name:'Restricted',password:await passwordHash(pass),role:'admin',status:'active',emailVerified:true,adminPermissions:['banners','users']});
 await mutation(agent,'post','/api/auth/login',{email:'restricted@example.com',password:pass}).expect(200);
 await agent.get('/api/admin/users?role=admin').expect(403);
 await agent.get('/api/admin/settings').expect(403);
 await agent.get('/api/admin/products').expect(403);
 await agent.get('/api/admin/overview').expect(403);
 await mutation(agent,'patch','/api/admin/email-queue',{enabled:false}).expect(403);
 const customerRow=await db.collection('users').findOne({email:'customer@example.com'});
 await mutation(agent,'patch','/api/admin/users/'+customerRow._id,{role:'admin',status:'active'}).expect(403);
 await mutation(agent,'patch','/api/admin/users/'+result.insertedId,{role:'admin',status:'active',adminPermissions:['settings']}).expect(400);
 const blog=await db.collection('content').insertOne({kind:'blog',title:'Private blog',slug:'private-blog'});
 assert.ok(!(await agent.get('/api/admin/content')).body.items.some(x=>x.kind==='blog'));
 await mutation(agent,'delete','/api/admin/content/'+blog.insertedId).expect(403);
 await mutation(agent,'put','/api/admin/content/'+blog.insertedId,{kind:'banner'}).expect(403);
 await mutation(owner,'patch','/api/admin/users/'+result.insertedId,{role:'admin',status:'active',adminPermissions:['settings']}).expect(200);
 await agent.get('/api/admin/users').expect(401);
 await mutation(agent,'post','/api/auth/login',{email:'restricted@example.com',password:pass}).expect(200);
 await agent.get('/api/admin/settings').expect(200);
 await agent.get('/api/admin/users').expect(403);
 await db.collection('users').deleteOne({_id:result.insertedId});
});
test('shipping modes and COD surcharge apply server-side to quotes and orders',async()=>{
 const settings=(await owner.get('/api/admin/settings')).body;
 const p=await product(10),items=[{productId:p.id,qty:1,size:''}];
 try {
  for(const [mode,shippingCost] of [['paid',75],['free',0],['threshold',0]]){
   await mutation(owner,'put','/api/admin/settings',{...settings,shippingMode:mode,shippingFee:75,freeShippingAbove:500,codFee:39.5}).expect(200);
   const quote=await mutation(request(app),'post','/api/checkout/guest/quote',{items}).expect(200);
   assert.equal(quote.body.shipping,shippingCost);assert.equal(quote.body.codFee,39.5);assert.equal(quote.body.total,1000+shippingCost+39.5);
  }
  const order=await request(app).post('/api/checkout/guest/orders').set('Origin','http://localhost:5173').set('X-Requested-With','RajoStore').set('Idempotency-Key',randomUUID()).send({items,address:shipping,codFee:0,total:1}).expect(201);
  assert.equal(order.body.codFee,39.5);assert.equal(order.body.total,1039.5);
  await mutation(customer,'patch','/api/admin/settings',{codEnabled:false}).expect(403);
  await mutation(owner,'patch','/api/admin/settings',{codEnabled:false}).expect(200);
  let current=(await owner.get('/api/admin/settings')).body;
  assert.equal(current.shippingFee,75);assert.equal(current.codFee,39.5);assert.equal(current.shippingMode,'threshold');
  await mutation(owner,'patch','/api/admin/settings',{shippingMode:'paid',shippingFee:80}).expect(200);
  current=(await owner.get('/api/admin/settings')).body;assert.equal(current.codEnabled,false);assert.equal(current.codFee,39.5);
  const disabledQuote=await mutation(request(app),'post','/api/checkout/guest/quote',{items}).expect(200);assert.equal(disabledQuote.body.codEnabled,false);
  await request(app).post('/api/checkout/guest/orders').set('Origin','http://localhost:5173').set('X-Requested-With','RajoStore').set('Idempotency-Key',randomUUID()).send({items,address:shipping}).expect(400);
 } finally {await mutation(owner,'put','/api/admin/settings',settings).expect(200);}
});
test('new-product outbox queues once, excludes unsubscribed users, pauses without credentials and sends privately', async () => {
  const {processProductEmails,unsubscribeToken,readUnsubscribeToken}=await import('../src/services/product-email.service.js');
  const p=await product();
  await db.collection('products').updateOne({id:p.id},{$set:{notificationRequestedAt:new Date()}});
  const optout=await db.collection('users').insertOne({name:'No updates',email:'no-updates@example.com',role:'customer',status:'active',emailUpdates:false,createdAt:new Date(0)});
  const paused=await processProductEmails(db,{enabled:false});assert.equal(paused.paused,true);
  const before=await db.collection('productEmailJobs').countDocuments({productId:p.id});assert.equal(before,2);
  await processProductEmails(db,{enabled:false});assert.equal(await db.collection('productEmailJobs').countDocuments({productId:p.id}),before);
  const recipients=[];
  await processProductEmails(db,{enabled:true,send:async(user,item)=>{recipients.push(user.email);assert.equal(item.id,p.id);}});
  assert.equal(recipients.length,2);assert.ok(!recipients.includes('no-updates@example.com'));
  await processProductEmails(db,{enabled:true,send:async()=>assert.fail('Duplicate email')});
  const token=unsubscribeToken(optout.insertedId);assert.equal(readUnsubscribeToken(token),String(optout.insertedId));
  await request(app).get('/api/internal/product-emails').expect(401);
  await request(app).get('/api/admin/email-queue').expect(401);
  await owner.get('/api/admin/email-queue').expect(200);
});
test('banners accept clean links and responsive fields, while drafts and external links stay excluded',async()=>{
  const data={kind:'banner',title:'Preview banner',slug:'preview-responsive-banner',imageUrl:'https://example.com/desktop.jpg',mobileImageUrl:'https://example.com/mobile.jpg',secondaryImageUrl:'https://example.com/second.jpg',layout:'split',eyebrow:'NEW ARRIVALS',buttonText:'Shop now',link:'/collections/all',status:'draft',sortOrder:4};
  const saved=await mutation(owner,'post','/api/admin/content',data).expect(201);
  assert.ok(!(await request(app).get('/api/content')).body.items.some(row=>row.slug===data.slug));
  await mutation(owner,'put','/api/admin/content/'+saved.body._id,{...data,status:'published'}).expect(200);
  const row=(await request(app).get('/api/content')).body.items.find(row=>row.slug===data.slug);assert.equal(row.mobileImageUrl,data.mobileImageUrl);assert.equal(row.buttonText,'Shop now');
  await mutation(owner,'put','/api/admin/content/'+saved.body._id,{...data,link:'//evil.example'}).expect(400);
});
test('mobile signup requires a unique number and signs in without verification when disabled', async () => {
  const previous = config.requireEmailVerification; config.requireEmailVerification = false;
  try {
    const agent = request.agent(app);
    await request(app).post('/api/auth/signup').set('Origin','http://localhost:5173').set('X-Requested-With','RajoStore').send({ name:'Mobile User', email:'mobile-missing@example.com', password:pass }).expect(400);
    const created = await mutation(agent,'post','/api/auth/signup',{ name:'Mobile User', email:'mobile@example.com', phone:'+91 9988776655', password:pass }).expect(201);
    assert.equal(created.body.user.phone, '9988776655');
    assert.equal(created.body.user.emailVerified,false);
    assert.equal(codes.has('mobile@example.com:verify'),false);
    await mutation(request(app),'post','/api/auth/login',{ phone:'9988776655', password:pass }).expect(200);
    await mutation(request(app),'post','/api/auth/login',{ phone:'9988776655', password:'wrong' }).expect(401);
    await mutation(request(app),'post','/api/auth/signup',{ name:'Duplicate', email:'duplicate-mobile@example.com', phone:'9988776655', password:pass }).expect(409);
  } finally { config.requireEmailVerification = previous; }
});
test('guest checkout prices on server, is idempotent, reduces stock and never exposes orders to another customer', async () => {
  const p = await product(4), key = randomUUID();
  const payload = { address: shipping, items:[{ productId:p.id, qty:2, size:'', unitPrice:1 }], total:1 };
  const quote = await mutation(request(app),'post','/api/checkout/guest/quote',{items:payload.items}).expect(200);
  assert.equal(quote.body.subtotal,2000);
  const send = () => request(app).post('/api/checkout/guest/orders').set('Origin','http://localhost:5173').set('X-Requested-With','RajoStore').set('Idempotency-Key',key).send(payload);
  const first = await send().expect(201), retry = await send().expect(201);
  assert.equal(first.body._id,retry.body._id);
  assert.equal(first.body.guest,true);
  assert.equal(first.body.subtotal,2000);
  assert.equal((await db.collection('products').findOne({id:p.id})).stock,2);
  assert.ok(!(await customer.get('/api/orders')).body.items.some(o=>o._id===first.body._id));
  await mutation(request(app),'post','/api/checkout/guest/quote',{ items:[{productId:p.id,qty:2},{productId:p.id,qty:2}] }).expect(409);
  await mutation(request(app),'post','/api/checkout/guest/quote',{items:[{productId:p.id,qty:-1}]}).expect(400);
  await request(app).post('/api/checkout/guest/orders').send(payload).expect(403);
});
test('media library requires admin and supports reusable image names', async () => {
  await request(app).get('/api/admin/media').expect(401);
  await customer.get('/api/admin/media').expect(403);
  const media = await db.collection('media').insertOne({url:'https://images.example.com/test.png',label:'Original',provider:'r2',createdAt:new Date()});
  await mutation(owner,'patch','/api/admin/media/'+media.insertedId,{label:'Catalogue photo'}).expect(200);
  const result = await owner.get('/api/admin/media').expect(200);
  assert.ok(result.body.items.some(item=>item.label==='Catalogue photo'));
});
test("only successful public catalogue responses are edge-cacheable", async () => {
  for (const path of ["/api/products", "/api/content"]) {
    const response = await request(app).get(path).expect(200);
    assert.match(response.headers["vercel-cdn-cache-control"], /s-maxage=30/);
    assert.match(response.headers["cache-control"], /max-age=0/);
  }
  for (const path of ["/api/auth/me", "/api/cart", "/api/admin/users", "/api/products/999999"]) {
    const response = await request(app).get(path);
    assert.ok(response.status >= 400);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers["vercel-cdn-cache-control"], undefined);
  }
});
const pass = "A-test-password-123!";
const mutation = (agent, method, path, body) =>
  agent[method](path)
    .set("Origin", "http://localhost:5173")
    .set("X-Requested-With", "RajoStore")
    .send(path === '/api/auth/signup' && !body.phone ? { ...body, phone: '9' + (parseInt(createHash('sha256').update(body.email).digest('hex').slice(0,10),16) % 1e9).toString().padStart(9,'0') } : body);
async function signup(agent, email) {
  await mutation(agent, "post", "/api/auth/signup", {
    name: email.split("@")[0],
    email,
    password: pass,
  }).expect(202);
  const code = codes.get(email + ":verify");
  await mutation(agent, "post", "/api/auth/verify", {
    email,
    code,
    password: pass,
  }).expect(200);
  const result = await mutation(agent, "post", "/api/auth/login", {
    email,
    password: pass,
  }).expect(200);
  return result.body.user;
}
async function product(stock = 10) {
  const p = {
    id: Math.floor(Math.random() * 1e7) + 100,
    name: "Test saree",
    sku: randomUUID(),
    category: "Sarees",
    fabric: "Cotton",
    price: 1000,
    old: 1200,
    imageUrl: "",
    stock,
    status: "active",
    sizes: [],
    color: "#173b69",
  };
  await db.collection("products").insertOne(p);
  return p;
}
const shipping = {
  name: "Test Customer",
  phone: "9876543210",
  line1: "12 Test Street",
  line2: "",
  city: "Jaipur",
  state: "Rajasthan",
  postalCode: "302001",
  country: "India",
};
before(async () => {
  repl = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });
  client = await new MongoClient(repl.getUri()).connect();
  db = client.db("rajo_integration");
  await createIndexes(db);
  app = createApp({
    getConnection: async () => ({ client, db }),
    deliverCode: async (email, code, purpose) =>
      codes.set(email + ":" + purpose, code),
  });
  owner = request.agent(app).set('X-Session-Scope', 'admin');
  customer = request.agent(app);
  other = request.agent(app);
  await signup(owner, "owner@example.com");
  await signup(customer, "customer@example.com");
  await signup(other, "other@example.com");
  await db.collection("settings").insertOne({
    _id: "store",
    shippingFee: 50,
    freeShippingAbove: 2999,
    codEnabled: true,
  });
});
after(async () => {
  await client?.close();
  await repl?.stop();
});
test("JWT signature, expiry and logout revocation are enforced", async () => {
  const agent = request.agent(app);
  const result = await mutation(agent, "post", "/api/auth/login", {
    email: "customer@example.com",
    password: pass,
  }).expect(200);
  const cookie = result.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  const token = cookie.split(";")[0].slice(13);
  assert.equal(token.split(".").length, 3);
  const claims = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "rajo-api",
    audience: "rajo-store",
  });
  assert.ok(claims.sub && claims.jti);
  const forged = jwt.sign(
    { sub: claims.sub, jti: claims.jti },
    "wrong-signing-secret-that-is-long-enough",
    { issuer: "rajo-api", audience: "rajo-store", expiresIn: "7d" },
  );
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + forged)
    .expect(401);
  const expired = jwt.sign(
    { sub: claims.sub, jti: claims.jti },
    process.env.JWT_SECRET,
    { issuer: "rajo-api", audience: "rajo-store", expiresIn: -1 },
  );
  // Insert a matching session to prove the JWT expiry check is independently enforced.
  await db
    .collection("sessions")
    .insertOne({
      _id: hash(expired),
      userId: (
        await db.collection("users").findOne({ email: "customer@example.com" })
      )._id,
      expiresAt: new Date(Date.now() + 60000),
    });
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + expired)
    .expect(401);
  await mutation(agent, "post", "/api/auth/logout").expect(200);
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", "rajo_session=" + token)
    .expect(401);
});

test("invalid combined order updates roll back status and stock", async () => {
  const p = await product(2);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 1 }],
  }).expect(200);
  const created = await mutation(customer, "post", "/api/orders", {
    address: shipping,
  })
    .set("Idempotency-Key", randomUUID())
    .expect(201);
  await mutation(owner, "patch", "/api/admin/orders/" + created.body._id, {
    status: "cancelled",
    paymentStatus: "paid",
  }).expect(400);
  const order = await db
    .collection("orders")
    .findOne({ number: created.body.number });
  assert.equal(order.status, "placed");
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    1,
  );
  await mutation(owner, "patch", "/api/admin/orders/" + created.body._id, {
    status: "cancelled",
  }).expect(200);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    2,
  );
});
test("signup requires verification; password hashes and role are server controlled", async () => {
  const a = request.agent(app),
    email = "pending@example.com";
  await mutation(a, "post", "/api/auth/signup", {
    name: "Pending",
    email,
    password: pass,
    role: "admin",
    emailVerified: true,
  }).expect(202);
  await mutation(a, "post", "/api/auth/login", {
    email,
    password: pass,
  }).expect(403);
  const u = await db.collection("users").findOne({ email });
  assert.notEqual(u.password, pass);
  assert.equal(u.role, "customer");
  assert.equal(u.emailVerified, false);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: "000000",
    password: pass,
  }).expect(400);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(200);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(400);
});
test("account and admin endpoints enforce sessions and roles", async () => {
  await request(app).get("/api/cart").expect(401);
  await customer.get("/api/admin/users").expect(403);
  const r = await owner.get("/api/admin/users").expect(200);
  assert.ok(r.body.items.length > 0);
  assert.ok(r.body.items.every(u=>u.role === 'customer'));
  const admins=await owner.get('/api/admin/users?role=admin').expect(200);
  assert.ok(admins.body.items.length>0);
  assert.ok(admins.body.items.every(u=>u.role==='admin'&&!u.password));
  assert.ok(r.body.items.every((u) => !u.password));
  await mutation(customer, "patch", "/api/account", {
    name: "Customer",
    phone: '9123456789',
    role: "admin",
    addresses: [],
  }).expect(200);
  assert.equal((await customer.get("/api/auth/me")).body.user.role, "customer");
});

test("signup without verification skips email, starts a customer session and protects existing accounts", async () => {
  config.requireEmailVerification = false;
  let mailCalls = 0;
  const directApp = createApp({ getConnection: async () => ({ client, db }), deliverCode: async () => { mailCalls++; throw new Error('SMTP unavailable'); } });
  const agent = request.agent(directApp);
  const email = "direct-signup@example.com";
  try {
    const created = await mutation(agent, 'post', '/api/auth/signup', { name: 'Direct User', email, password: pass, role: 'admin', emailVerified: true }).expect(201);
    assert.equal(created.body.user.role, 'customer');
    assert.equal(created.body.user.emailVerified, false);
    assert.equal(mailCalls, 0);
    await agent.get('/api/auth/me').expect(200);
    await agent.get('/api/cart').expect(200);
    await agent.get('/api/admin/users').expect(403);
    await mutation(agent, 'post', '/api/auth/logout').expect(200);
    await mutation(agent, 'post', '/api/auth/signup', { name: 'Replacement', email, password: 'Different-password!' }).expect(409);
    await mutation(agent, 'post', '/api/auth/login', { email, password: pass }).expect(200);
    await mutation(agent, 'post', '/api/auth/login', { email: 'pending@example.com', password: pass }).expect(200);
    await mutation(agent, 'post', '/api/auth/signup', { name: 'Pretend Owner', email: 'owner@example.com', password: pass }).expect(409);
    assert.equal(mailCalls, 0);
  } finally { config.requireEmailVerification = true; }
});
test("cross-origin writes are rejected", async () => {
  await request(app)
    .post("/api/auth/login")
    .set("Origin", "https://untrusted.example")
    .set("X-Requested-With", "RajoStore")
    .send({ email: "owner@example.com", password: pass })
    .expect(403);
});

test('admin deletion hides products and users, revokes sessions and protects the owner', async () => {
  const p = await product();
  await mutation(customer, 'delete', '/api/admin/products/' + p.id).expect(403);
  await mutation(owner, 'delete', '/api/admin/products/' + p.id).expect(200);
  const catalogue = await owner.get('/api/admin/products').expect(200);
  assert.ok(!catalogue.body.items.some(row => row.id === p.id));
  assert.equal((await db.collection('products').findOne({ id: p.id })).status, 'deleted');
  await request(app).get('/api/products/' + p.id).expect(404);
  const agent = request.agent(app);
  const u = await signup(agent, 'delete-user@example.com');
  const ordersBefore = await db.collection('orders').countDocuments();
  await mutation(customer, 'delete', '/api/admin/users/' + u.id).expect(403);
  await mutation(owner, 'delete', '/api/admin/users/' + u.id).expect(200);
  await agent.get('/api/auth/me').expect(401);
  await mutation(agent, 'post', '/api/auth/login', { email: u.email, password: pass }).expect(401);
  const users = await owner.get('/api/admin/users').expect(200);
  assert.ok(!users.body.items.some(row => String(row._id) === u.id));
  assert.equal(await db.collection('orders').countDocuments(), ordersBefore);
  const admin = (await owner.get('/api/auth/me')).body.user;
  await mutation(owner, 'delete', '/api/admin/users/' + admin.id).expect(400);
});

test('dashboard charts use real order totals and provide 30 days of data', async () => {
  const response = await owner.get('/api/admin/overview').expect(200);
  assert.equal(response.body.dailySales.length, 30);
  assert.equal(response.body.orderStatuses.reduce((sum, row) => sum + row.count, 0), await db.collection('orders').countDocuments());
  assert.ok(response.body.dailySales.every(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.orders >= 0 && row.revenue >= 0));
});

test('admin and customer sessions remain independent in the same browser', async () => {
  const both = request.agent(app);
  await mutation(both, 'post', '/api/auth/login', { email: 'owner@example.com', password: pass }).expect(403);
  const admin = await mutation(both, 'post', '/api/auth/login', { email: 'owner@example.com', password: pass }).set('X-Session-Scope', 'admin').expect(200);
  assert.match(admin.headers['set-cookie'][0], /^rajo_admin_session=/);
  await both.get('/api/auth/me').expect(401);
  await mutation(both, 'post', '/api/auth/login', { email: 'customer@example.com', password: pass }).expect(200);
  assert.equal((await both.get('/api/auth/me')).body.user.email, 'customer@example.com');
  assert.equal((await both.get('/api/auth/me').set('X-Session-Scope', 'admin')).body.user.email, 'owner@example.com');
  await mutation(both, 'post', '/api/auth/logout').set('X-Session-Scope', 'admin').expect(200);
  await both.get('/api/auth/me').expect(200);
  await both.get('/api/admin/users').expect(401);
});

test('wishlist requires login and admins can read customer cart/wishlist details', async () => {
  await mutation(request(app), 'put', '/api/wishlist', { items: [] }).expect(401);
  const p = await product();
  await mutation(customer, 'put', '/api/cart', { items: [{ productId: p.id, qty: 2 }] }).expect(200);
  await mutation(customer, 'put', '/api/wishlist', { items: [p.id] }).expect(200);
  const user = (await customer.get('/api/auth/me')).body.user;
  await customer.get('/api/admin/users/' + user.id + '/shopping').expect(403);
  const details = await owner.get('/api/admin/users/' + user.id + '/shopping').expect(200);
  assert.equal(details.body.cart[0].qty, 2);
  assert.equal(details.body.cart[0].lineTotal, p.price * 2);
  assert.equal(details.body.wishlist[0].id, p.id);
  const list = await owner.get('/api/admin/users').expect(200);
  const row = list.body.items.find(u => String(u._id) === user.id);
  assert.equal(row.cartCount, 2); assert.equal(row.wishlistCount, 1); assert.equal(row.password, undefined);
});
test("public catalog filters drafts and product inputs are validated", async () => {
  const a = await product();
  await db
    .collection("products")
    .updateOne({ id: a.id }, { $set: { status: "draft" } });
  await request(app)
    .get("/api/products/" + a.id)
    .expect(404);
  await mutation(owner, "post", "/api/admin/products", {
    name: "Bad",
    price: -1,
  }).expect(400);
  const good = {
    name: "Admin saree",
    sku: randomUUID(),
    category: "Sarees",
    fabric: "Silk",
    price: 900,
    old: 0,
    stock: 5,
    status: "active",
    imageUrl: "",
  };
  const r = await mutation(owner, "post", "/api/admin/products", good).expect(
    201,
  );
  assert.equal(r.body.imageUrl, "");
  await mutation(owner, "delete", "/api/admin/products/" + r.body.id).expect(
    200,
  );
  await request(app)
    .get("/api/products/" + r.body.id)
    .expect(404);
});
test("cart and wishlist persist per user; client prices are ignored", async () => {
  const p = await product();
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 2, price: 1 }],
  }).expect(200);
  const r = await customer.get("/api/cart").expect(200);
  assert.equal(r.body.items[0].qty, 2);
  assert.equal((await other.get("/api/cart")).body.items.length, 0);
  await mutation(customer, "put", "/api/wishlist", { items: [p.id] }).expect(
    200,
  );
  assert.deepEqual((await customer.get("/api/cart")).body.wishlist, [p.id]);
  const quote = await mutation(
    customer,
    "post",
    "/api/checkout/quote",
    {},
  ).expect(200);
  assert.equal(quote.body.total, 2050);
});
test("checkout is idempotent and cancellation restores stock exactly once", async () => {
  const p = await product(5);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 2 }],
  }).expect(200);
  const key = randomUUID();
  const submit = () =>
    customer
      .post("/api/orders")
      .set("Origin", "http://localhost:5173")
      .set("X-Requested-With", "RajoStore")
      .set("Idempotency-Key", key)
      .send({ address: shipping, total: 1 });
  const first = await submit().expect(201);
  const second = await submit().expect(201);
  assert.equal(first.body._id, second.body._id);
  assert.equal(first.body.total, 2050);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    3,
  );
  await mutation(
    other,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(404);
  await mutation(
    customer,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(200);
  await mutation(
    customer,
    "post",
    "/api/orders/" + first.body._id + "/cancel",
  ).expect(200);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    5,
  );
});
test("concurrent checkouts cannot oversell the last unit", async () => {
  const p = await product(1);
  for (const a of [customer, other])
    await mutation(a, "put", "/api/cart", {
      items: [{ productId: p.id, qty: 1 }],
    }).expect(200);
  const result = await Promise.all(
    [customer, other].map((a) =>
      a
        .post("/api/orders")
        .set("Origin", "http://localhost:5173")
        .set("X-Requested-With", "RajoStore")
        .set("Idempotency-Key", randomUUID())
        .send({ address: shipping }),
    ),
  );
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (await db.collection("products").findOne({ id: p.id })).stock,
    0,
  );
});
test("coupons and COD setting are enforced server-side", async () => {
  const p = await product(8);
  await mutation(customer, "put", "/api/cart", {
    items: [{ productId: p.id, qty: 1 }],
  }).expect(200);
  await mutation(owner, "post", "/api/admin/coupons", {
    code: "SAVE10",
    type: "percentage",
    value: 10,
    minimum: 500,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    active: true,
  }).expect(201);
  const quote = await mutation(customer, "post", "/api/checkout/quote", {
    coupon: "SAVE10",
  }).expect(200);
  assert.equal(quote.body.total, 950);
  await db
    .collection("settings")
    .updateOne({ _id: "store" }, { $set: { codEnabled: false } });
  await customer
    .post("/api/orders")
    .set("Origin", "http://localhost:5173")
    .set("X-Requested-With", "RajoStore")
    .set("Idempotency-Key", randomUUID())
    .send({ address: shipping })
    .expect(400);
  await db
    .collection("settings")
    .updateOne({ _id: "store" }, { $set: { codEnabled: true } });
});
test("real reviews require login and moderation; demo reviews are labelled and excluded from averages", async () => {
  const p = await product();
  await mutation(request(app), "post", "/api/products/" + p.id + "/reviews", {
    rating: 5,
    title: "Lovely",
    body: "Beautiful fabric and finish.",
  }).expect(401);
  await mutation(customer, "post", "/api/products/" + p.id + "/reviews", {
    rating: 4,
    title: "Lovely",
    body: "Beautiful fabric and finish.",
    verifiedPurchase: true,
    isDemo: false,
  }).expect(201);
  let list = (await request(app).get("/api/products/" + p.id + "/reviews"))
    .body;
  assert.equal(list.items.length, 0);
  const review = await db.collection("reviews").findOne({ productId: p.id });
  assert.equal(review.verifiedPurchase, false);
  await mutation(owner, "patch", "/api/admin/reviews/" + review._id, {
    status: "published",
  }).expect(200);
  await mutation(owner, "post", "/api/admin/reviews", {
    productId: p.id,
    rating: 5,
    title: "Sample review",
    body: "Sample content for layout testing.",
    status: "published",
    isDemo: false,
  }).expect(201);
  list = (await request(app).get("/api/products/" + p.id + "/reviews")).body;
  assert.equal(list.items.length, 2);
  assert.equal(list.count, 1);
  assert.equal(list.average, 4);
  assert.equal(list.items.filter((r) => r.isDemo).length, 1);
  await mutation(customer, "post", "/api/products/" + p.id + "/reviews", {
    rating: 5,
    title: "Duplicate",
    body: "A duplicate review is rejected.",
  }).expect(409);
});
test("content publication controls storefront visibility and image is optional", async () => {
  const record = await mutation(owner, "post", "/api/admin/content", {
    kind: "blog",
    title: "A story",
    slug: "a-story",
    body: "The story begins here.",
    status: "draft",
  }).expect(201);
  assert.equal(
    (await request(app).get("/api/content?kind=blog")).body.items.length,
    0,
  );
  await mutation(owner, "put", "/api/admin/content/" + record.body._id, {
    kind: "blog",
    title: "A story",
    slug: "a-story",
    body: "The story begins here.",
    status: "published",
  }).expect(200);
  assert.equal(
    (await request(app).get("/api/content?kind=blog")).body.items.length,
    1,
  );
  await mutation(customer, "post", "/api/admin/content", {
    kind: "blog",
  }).expect(403);
});
test("reset password revokes old sessions; verification code cannot be reused", async () => {
  const a = request.agent(app);
  await signup(a, "reset@example.com");
  await mutation(a, "post", "/api/auth/forgot", {
    email: "reset@example.com",
  }).expect(200);
  const code = codes.get("reset@example.com:reset");
  await mutation(a, "post", "/api/auth/reset", {
    email: "reset@example.com",
    code,
    password: "A-new-password-123!",
  }).expect(200);
  await a.get("/api/auth/me").expect(401);
  await mutation(a, "post", "/api/auth/reset", {
    email: "reset@example.com",
    code,
    password: pass,
  }).expect(400);
});
test("blocked users lose access and owner cannot be demoted", async () => {
  const a = request.agent(app);
  const u = await signup(a, "blocked@example.com");
  await mutation(owner, "patch", "/api/admin/users/" + u.id, {
    role: "customer",
    status: "blocked",
  }).expect(200);
  await a.get("/api/auth/me").expect(401);
  const me = (await owner.get("/api/auth/me")).body.user;
  await mutation(owner, "patch", "/api/admin/users/" + me.id, {
    role: "customer",
    status: "blocked",
  }).expect(400);
});
test("enquiries reach admin and optional uploads fail clearly without a token", async () => {
  await mutation(request(app), "post", "/api/enquiries", {
    name: "Customer",
    email: "enquiry@example.com",
    subject: "Sizing",
    message: "Can you help with the sizing?",
  }).expect(201);
  assert.equal((await owner.get("/api/admin/enquiries")).body.items.length, 1);
  await mutation(customer, "post", "/api/admin/uploads", {}).expect(403);
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    await mutation(owner, "post", "/api/admin/uploads", {}).expect(503);
});
test("verification codes lock after five failures", async () => {
  const a = request.agent(app);
  const email = "locked@example.com";
  await mutation(a, "post", "/api/auth/signup", {
    name: "Locked",
    email,
    password: pass,
  }).expect(202);
  for (let i = 0; i < 5; i++)
    await mutation(a, "post", "/api/auth/verify", {
      email,
      code: "000000",
      password: pass,
    }).expect(400);
  await mutation(a, "post", "/api/auth/verify", {
    email,
    code: codes.get(email + ":verify"),
    password: pass,
  }).expect(400);
});
