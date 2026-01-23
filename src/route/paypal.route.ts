import { Router } from "express";
import { completeVaultPurchase, createPaypalSetupToken } from "../controller/paypal.controller";

const paypalRoute = Router();
paypalRoute.post('/create-setup-token', createPaypalSetupToken);
paypalRoute.get('/complete-purchase', completeVaultPurchase);
export default paypalRoute;