import { Router } from "express";
import { CheckDonPaymentStripe, createDonPaymentStripe, getAllDonations } from "../controller/don.controller";

const donRoute = Router();
donRoute.post('/stripe/pay', createDonPaymentStripe);
donRoute.get('/check/stripe/status', CheckDonPaymentStripe);
donRoute.get('/all', getAllDonations);
export default donRoute;