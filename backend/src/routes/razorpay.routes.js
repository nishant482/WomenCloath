import {Router} from 'express';
import {authenticate} from '../middleware/auth.js';
import * as c from '../controllers/razorpay.controller.js';
const router=Router();
router.get('/admin/payment-gateway',c.getGatewaySettings);
router.put('/admin/payment-gateway',c.saveGatewaySettings);
router.post('/admin/orders/sync-payments',c.syncOnlinePayments);
for(const [path,handler] of [['create',c.createOnlinePayment],['verify',c.verifyOnlinePayment],['status',c.onlinePaymentStatus]]){
 router.post('/checkout/guest/razorpay/'+path,handler);
 router.post('/checkout/razorpay/'+path,authenticate,handler);
}
export default router;
