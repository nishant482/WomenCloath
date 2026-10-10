import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {fail,hash} from './auth.service.js';
import {priceCart} from './order.service.js';
import {gatewayConfig,decryptPaymentSecret,razorpayRequest} from './razorpay-config.service.js';
const validKey=key=>{if(!/^[a-zA-Z0-9_-]{32,64}$/.test(key||''))throw fail(400,'A checkout request identifier is required.');};
export function paymentActor(user,key,input){validKey(key);return user||{_id:'guest:'+hash(key),guest:true,name:input?.address?.name,email:input?.email||''};}
export const checkoutPaymentData=attempt=>({attemptId:attempt._id,keyId:attempt.keyId,razorpayOrderId:attempt.gatewayOrderId,amount:Math.round(attempt.quote.total*100),currency:'INR',mode:'test'});
export async function beginPayment(db,user,input,key,call=razorpayRequest){
 validKey(key);const credentials=await gatewayConfig(db);
 if(!credentials?.enabled||!credentials?.keyId?.startsWith('rzp_test_')||!credentials.encryptedSecret)throw fail(400,'Online payments are unavailable.');
 const actor=paymentActor(user,key,input),id=hash(String(actor._id)+':'+key),fingerprint=hash(JSON.stringify(input));
 let attempt=await db.collection('paymentAttempts').findOne({_id:id});
 if(!attempt){
  const cart=input.items||user?.cart||[];
  const quote=await priceCart(db,cart,input.coupon);quote.total=Math.round((quote.total-quote.codFee)*100)/100;quote.codFee=0;
  if(quote.total<1)throw fail(400,'Online payment amount must be at least INR 1.');
  attempt={_id:id,actor:{_id:actor._id,name:actor.name,email:actor.email,guest:Boolean(actor.guest)},input,cartSnapshot:user?.cart,quote,fingerprint,keyHash:hash(key),keyId:credentials.keyId,encryptedSecret:credentials.encryptedSecret,state:'created',createdAt:new Date()};
  try{await db.collection('paymentAttempts').insertOne(attempt);}catch(e){if(e.code!==11000)throw e;attempt=await db.collection('paymentAttempts').findOne({_id:id});}
 }
 if(attempt.fingerprint!==fingerprint)throw fail(409,'Checkout details changed. Start a new payment attempt.');
 if(attempt.gatewayOrderId)return checkoutPaymentData(attempt);
 const lock=await db.collection('paymentAttempts').findOneAndUpdate({_id:id,gatewayOrderId:{$exists:false},$or:[{lockUntil:{$exists:false}},{lockUntil:{$lt:new Date()}}]},{$set:{lockUntil:new Date(Date.now()+45000)}},{returnDocument:'after'});
 if(!lock)throw fail(409,'Payment is being prepared. Please retry in a moment.');
 const remote=await call(attempt,'/orders','POST',{amount:Math.round(attempt.quote.total*100),currency:'INR',receipt:id.slice(0,30)+randomUUID().slice(0,8),partial_payment:false});
 if(!/^order_[a-zA-Z0-9]+$/.test(remote.id)||remote.amount!==Math.round(attempt.quote.total*100)||remote.currency!=='INR')throw fail(502,'Invalid payment provider response.');
 await db.collection('paymentAttempts').updateOne({_id:id},{$set:{gatewayOrderId:remote.id,state:'pending'},$unset:{lockUntil:''}});
 return checkoutPaymentData({...attempt,gatewayOrderId:remote.id});
}
export async function ownedAttempt(db,user,key,id){
 const actor=paymentActor(user,key);const attempt=await db.collection('paymentAttempts').findOne({_id:id,keyHash:hash(key),'actor._id':actor._id});
 if(!attempt)throw fail(404,'Payment attempt not found.');return attempt;
}
export function verifyPaymentSignature(attempt,paymentId,signature){
 const expected=createHmac('sha256',decryptPaymentSecret(attempt.encryptedSecret)).update(attempt.gatewayOrderId+'|'+paymentId).digest();
 const supplied=/^[a-f0-9]{64}$/i.test(signature||'')?Buffer.from(signature,'hex'):Buffer.alloc(0);
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw fail(400,'Payment signature could not be verified.');
}
export async function settlePayment(client,db,attempt,payment){
 if(payment.order_id!==attempt.gatewayOrderId||payment.currency!=='INR'||payment.amount!==Math.round(attempt.quote.total*100)||payment.status!=='captured')throw fail(400,'Payment details do not match this order.');
 const session=client.startSession();
 try{return await session.withTransaction(async()=>{
  const existing=await db.collection('orders').findOne({userId:attempt.actor._id,idempotencyKey:'rzp_'+attempt._id},{session});if(existing)return existing;
  const quantities=new Map();for(const line of attempt.quote.items)quantities.set(line.productId,(quantities.get(line.productId)||0)+line.qty);
  let available=true;
  for(const [id,qty] of quantities){const product=await db.collection('products').findOne({id,status:'active',stock:{$gte:qty}},{session});if(!product)available=false;}
  if(available)for(const [id,qty] of quantities)await db.collection('products').updateOne({id},{$inc:{stock:-qty},$set:{updatedAt:new Date()}},{session});
  const {codEnabled,...quote}=attempt.quote;
  const order={...quote,number:'RAJO-'+randomUUID().slice(0,8).toUpperCase(),userId:attempt.actor._id,email:attempt.actor.email,customer:attempt.actor.name,guest:attempt.actor.guest,address:attempt.input.address,paymentMethod:'razorpay',paymentMode:'test',paymentStatus:available?'paid':'refund_pending',status:available?'placed':'cancelled',stockDeducted:available,razorpayOrderId:attempt.gatewayOrderId,razorpayPaymentId:payment.id,idempotencyKey:'rzp_'+attempt._id,createdAt:new Date(),updatedAt:new Date(),history:[{status:available?'placed':'cancelled',at:new Date()}],...(!available?{paymentNote:'Payment captured but stock unavailable. Refund required in Razorpay.'}:{})};
  const result=await db.collection('orders').insertOne(order,{session});
  await db.collection('paymentAttempts').updateOne({_id:attempt._id},{$set:{state:'completed',orderId:result.insertedId,completedAt:new Date()}},{session});
  if(!attempt.actor.guest&&!attempt.input.items&&attempt.cartSnapshot)await db.collection('users').updateOne({_id:attempt.actor._id,cart:attempt.cartSnapshot},{$set:{cart:[],updatedAt:new Date()}},{session});
  return {...order,_id:result.insertedId};
 });}catch(e){if(e.code===11000){const existing=await db.collection('orders').findOne({userId:attempt.actor._id,idempotencyKey:'rzp_'+attempt._id});if(existing)return existing;}throw e;}finally{await session.endSession();}
}
export async function confirmPayment(client,db,attempt,paymentId,call=razorpayRequest){
 let payment=await call(attempt,'/payments/'+paymentId);
 if(payment.order_id!==attempt.gatewayOrderId||payment.amount!==Math.round(attempt.quote.total*100)||payment.currency!=='INR')throw fail(400,'Payment details do not match this order.');
 if(payment.status==='authorized'){
  try{payment=await call(attempt,'/payments/'+paymentId+'/capture','POST',{amount:payment.amount,currency:'INR'});}catch{payment=await call(attempt,'/payments/'+paymentId);}
 }
 if(payment.status!=='captured')throw fail(409,'Payment is not confirmed yet. Check payment status before paying again.');
 return settlePayment(client,db,attempt,payment);
}
export async function recoverPayment(client,db,attempt,call=razorpayRequest){
 if(attempt.orderId)return db.collection('orders').findOne({_id:attempt.orderId});
 if(!attempt.gatewayOrderId)return null;
 const result=await call(attempt,'/orders/'+attempt.gatewayOrderId+'/payments');
 const payment=result.items?.find(p=>['captured','authorized'].includes(p.status));
 return payment?confirmPayment(client,db,attempt,payment.id,call):null;
}
