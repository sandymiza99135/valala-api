import { Router } from "express";
import { login, loginGoogle, register, verifyToken } from "../controller/auth.controller";

const authRoute = Router();
authRoute.post('/google', loginGoogle);
authRoute.post('/register', register);
authRoute.post('/login', login);
authRoute.get('/verify/:token', verifyToken);
export default authRoute ;