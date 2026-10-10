let loading;
export async function openRazorpay(payment,prefill){
 if(!window.Razorpay){
  if(!loading)loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;const timer=setTimeout(()=>{script.remove();loading=null;reject(Error('Payment window could not load. Please retry.'));},15000);script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();loading=null;reject(Error('Payment window could not load. Please retry.'));};document.head.appendChild(script);});
  await loading;
 }
 return new Promise((resolve,reject)=>{
  const checkout=new window.Razorpay({key:payment.keyId,order_id:payment.razorpayOrderId,amount:payment.amount,currency:payment.currency,name:'RAJO Threads',description:'Test payment',prefill,theme:{color:'#c32643'},handler:resolve,modal:{ondismiss:()=>reject(Error('Payment window closed. No order is confirmed. You can retry or check payment status.'))}});
  checkout.open();
 });
}
