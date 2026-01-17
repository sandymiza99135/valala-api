import express from 'express';
import cors from 'cors';
import authRoute from './route/auth.route';
import productRoute from './route/product.route';
import paymentRoute from './route/payment.route';
import activityRoute from './route/activity.route';
import donRoute from './route/don.route';

//import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/product', productRoute);
app.use('/api/order', paymentRoute);
app.use('/api/activity', activityRoute);
app.use('/api/don', donRoute);
app.get("/",(req:any,res:any)=>res.send(process.env.PAYPAL_API));

// app.use(errorHandler);

export default app;