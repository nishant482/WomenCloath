import {z} from 'zod';
import {checkoutSchema} from '../services/order.service.js';
import {email} from '../validators/schemas.js';
import {fail,rateLimit} from '../services/auth.service.js';
import {isOwner} from '../services/admin-access.service.js';
import {gatewayConfig,encryptPaymentSecret,razorpayRequest} from '../services/razorpay-config.service.js';
import {beginPayment,ownedAttempt,verifyPaymentSignature,confirmPayment,recoverPayment} from '../services/razorpay.service.js';
export async function getGatewaySettings(req,res){
 if(!isOwner(req.user))throw fail(403,'Only the owner can manage payment keys.');
 const c=await gatewayConfig(req.db);res.json({enabled:Boolean(c?.enabled),keyId:c?.keyId||'',hasSecret:Boolean(c?.encryptedSecret),mode:'test'});
}
export async function saveGatewaySettings(req,res){
 if(!isOwner(req.user))throw fail(403,'Only the owner can manage payment keys.');
 const data=z.object({enabled:z.boolean(),keyId:z.string().regex(/^rzp_test_[a-zA-Z0-9]+$/,'Use a Razorpay test key.'),secret:z.string().trim().max(200).optional()}).strict().parse(req.body);
 const old=await gatewayConfig(req.db);
 const encryptedSecret=data.secret?encryptPaymentSecret(data.secret):old?.keyId===data.keyId?old.encryptedSecret:null;
 if(!encryptedSecret)throw fail(400,'Enter the secret for this test key.');
 const credentials={keyId:data.keyId,encryptedSecret};
 await (req.services.razorpayRequest||razorpayRequest)(credentials,'/orders?count=1');
 await req.db.collection('paymentConfig').updateOne({_id:'razorpay'},{$set:{...credentials,enabled:data.enabled,updatedAt:new Date(),updatedBy:String(req.user._id)}},{upsert:true});
 res.json({ok:true});
}
const inputSchema=checkoutSchema.extend({email:email.optional()});
const key=req=>req.headers['idempotency-key'];
export async function createOnlinePayment(req,res){
 await rateLimit(req.db,'online-checkout:'+req.ip,30,3600);
 const input=inputSchema.parse(req.body);
 if(!req.user&&!input.items)throw fail(400,'Choose products to pay for.');
 res.json(await beginPayment(req.db,req.user,input,key(req),req.services.razorpayRequest));
}
export async function verifyOnlinePayment(req,res){
 await rateLimit(req.db,'online-verify:'+req.ip,90,600);
 const input=z.object({attemptId:z.string().regex(/^[a-f0-9]{64}$/),razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),razorpay_order_id:z.string().regex(/^order_[a-zA-Z0-9]+$/),razorpay_signature:z.string().max(128)}).parse(req.body);
 const attempt=await ownedAttempt(req.db,req.user,key(req),input.attemptId);
 if(attempt.gatewayOrderId!==input.razorpay_order_id)throw fail(400,'Payment order does not match.');
 verifyPaymentSignature(attempt,input.razorpay_payment_id,input.razorpay_signature);
 res.json({order:await confirmPayment(req.mongo,req.db,attempt,input.razorpay_payment_id,req.services.razorpayRequest)});
}
export async function onlinePaymentStatus(req,res){
 await rateLimit(req.db,'online-status:'+req.ip,90,600);
 const {attemptId}=z.object({attemptId:z.string().regex(/^[a-f0-9]{64}$/)}).parse(req.body);
 const attempt=await ownedAttempt(req.db,req.user,key(req),attemptId);
 res.json({order:await recoverPayment(req.mongo,req.db,attempt,req.services.razorpayRequest)});
}
export async function syncOnlinePayments(req,res){
 await rateLimit(req.db,'online-sync:'+req.user._id,30,3600);
 const attempts=await req.db.collection('paymentAttempts').find({state:'pending',gatewayOrderId:{$exists:true}}).sort({lastChecked:1,createdAt:1}).limit(5).toArray();
 const results=await Promise.allSettled(attempts.map(async attempt=>{
  await req.db.collection('paymentAttempts').updateOne({_id:attempt._id},{$set:{lastChecked:new Date()}});
  return recoverPayment(req.mongo,req.db,attempt,req.services.razorpayRequest);
 }));
 res.json({checked:attempts.length,confirmed:results.filter(r=>r.status==='fulfilled'&&r.value).length,errors:results.filter(r=>r.status==='rejected').length});
}
