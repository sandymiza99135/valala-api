import { Router } from "express";
import { CheckDonPaymentStripe, createDonPaymentStripe } from "../controller/don.controller";

const donRoute = Router();
donRoute.post('/stripe/pay', createDonPaymentStripe);
donRoute.get('/check/stripe/status', CheckDonPaymentStripe);
export default donRoute;