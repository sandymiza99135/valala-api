import { Router } from "express";
import { subscribeToBenevolat } from "../controller/benevole.controller";

const benevoleRoute = Router();
benevoleRoute.post('/subscribe', subscribeToBenevolat);
export default benevoleRoute;