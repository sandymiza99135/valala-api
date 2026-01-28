import { Router } from "express";
import { CheckDonPaymentStripe, checkPaypalPaymentStatus, createDonPaymentStripe, getAllDonations, initializePaypalPayment } from "../controller/don.controller";

const donRoute = Router();
donRoute.post('/stripe/pay', createDonPaymentStripe);
donRoute.get('/check/stripe/status', CheckDonPaymentStripe);
donRoute.get('/all', getAllDonations);
donRoute.post('/paypal/pay', initializePaypalPayment);
donRoute.get('/check/paypal/status/:id', checkPaypalPaymentStatus);
export default donRoute;