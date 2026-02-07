import { Router } from "express";
import { changeDeliveryStatus, checkPaymentStatus, CheckPaymentStripe, checkPaypalPaymentStatus, createPaymentStripe, getAllOrderPayment, getWebhookReturnPayment, initializePayment, initializePaymentGpay, initializePaypalPayment } from "../controller/payment.controller";

const paymentRoute = Router();
paymentRoute.post('/stripe/pay', createPaymentStripe);
paymentRoute.post('/pay', initializePayment);
paymentRoute.post('/paypal/pay', initializePaypalPayment);
paymentRoute.post('/gpay', initializePaymentGpay);
paymentRoute.post('/flw-webhook', getWebhookReturnPayment);
paymentRoute.post('/all', getAllOrderPayment);
paymentRoute.put('/:id/delivery', changeDeliveryStatus);
paymentRoute.get('/check/status/:tx_ref', checkPaymentStatus);
paymentRoute.get('/check/stripe/status', CheckPaymentStripe);
paymentRoute.get('/check/paypal/status/:id', checkPaypalPaymentStatus);
export default paymentRoute;