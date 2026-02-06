import { Router } from "express";
import { acknowledgeReceipt, CheckDonPaymentStripe, checkPaypalPaymentStatus, createDonPaymentStripe, createMaterialDonation, getAllDonations, getMaterialDonations, initializePaypalPayment } from "../controller/don.controller";

const donRoute = Router();
donRoute.post('/stripe/pay', createDonPaymentStripe);
donRoute.get('/check/stripe/status', CheckDonPaymentStripe);
donRoute.get('/all', getAllDonations);
donRoute.get('/material/all', getMaterialDonations);
donRoute.post('/paypal/pay', initializePaypalPayment);
donRoute.post('/material', createMaterialDonation);
donRoute.get('/check/paypal/status/:id', checkPaypalPaymentStatus);
donRoute.patch('/:id/status', acknowledgeReceipt);
export default donRoute;