import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';
export const createDonPaymentStripe = async (req: Request, res: Response) => {
    try {
        const { amount, user,token} = req.body;
        console.log({ amount, user});
        
        const result = await PaymentService.createDonationAndInitializePayment(
            token,
            amount, 
            user, 
        );

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Stripe Init Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
export const CheckDonPaymentStripe = async (req: Request, res: Response) => {
    try {
        const paymentIntentId : any  = req.query.paymentIntentId;
       
        
        const result = await PaymentService.confirmDonation(paymentIntentId);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Stripe Init Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};