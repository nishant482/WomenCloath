import {createHash,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {config} from '../config/env.js';
import {fail} from './auth.service.js';
const encryptionKey=()=>{
 if(config.jwtSecret.length<32)throw fail(503,'Payment encryption is not configured.');
 return createHash('sha256').update('rajo-payment-config:'+config.jwtSecret).digest();
};
export function encryptPaymentSecret(secret){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);
 const data=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
 return [iv,cipher.getAuthTag(),data].map(v=>v.toString('base64')).join('.');
}
export function decryptPaymentSecret(encrypted){
 const [iv,tag,data]=encrypted.split('.').map(v=>Buffer.from(v,'base64'));
 const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),iv);decipher.setAuthTag(tag);
 return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
export async function gatewayConfig(db){return db.collection('paymentConfig').findOne({_id:'razorpay'});}
export async function paymentOptions(db){
 const c=await gatewayConfig(db);
 return {onlineEnabled:Boolean(c?.enabled&&c?.keyId?.startsWith('rzp_test_')&&c?.encryptedSecret),onlineMode:'test'};
}
export async function razorpayRequest(credentials,path,method='GET',body){
 let response;
 try{response=await fetch('https://api.razorpay.com/v1'+path,{method,signal:AbortSignal.timeout(15000),headers:{Authorization:'Basic '+Buffer.from(credentials.keyId+':'+decryptPaymentSecret(credentials.encryptedSecret)).toString('base64'),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
 catch{throw fail(503,'Payment provider is unavailable. Check payment status before retrying.');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw fail(502,'Payment provider could not complete the request. Please retry or contact the store.');
 return data;
}
