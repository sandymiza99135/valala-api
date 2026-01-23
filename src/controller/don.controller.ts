import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';
import { transporter } from '../config/mail.config';
import { db } from '../config/db';
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
       
        console.log(process.env.MAIL_USER_NAME);
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
export const getAllDonations = async (req: Request, res: Response) => {
    try {
        // 1. Récupération des paramètres de la query (avec valeurs par défaut)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        
        const search = req.query.search || ''; // Recherche par nom ou email
        const status = req.query.status || ''; // Filtre par statut (pending, completed, etc.)
        const currency = req.query.currency || ''; // Filtre par devise

        // 2. Construction dynamique de la clause WHERE
        let queryParams = [];
        let whereClauses = [];

        if (search) {
            whereClauses.push(`(donor_name LIKE ? OR email LIKE ?)`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            whereClauses.push(`status = ?`);
            queryParams.push(status);
        }

        if (currency) {
            whereClauses.push(`currency = ?`);
            queryParams.push(currency);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 3. Requête pour compter le nombre total (pour la pagination côté front)
        const [totalResult]  :any = await db.execute(
            `SELECT COUNT(*) as total FROM donations ${whereSql}`,
            queryParams
        );
        console.log(" totalResult ",totalResult);
        
        const totalItems = totalResult[0].total;

        // 4. Requête principale avec Pagination
        const finalSql = `SELECT * FROM donations ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        console.log(limit  , offset);
        // On ajoute les valeurs de pagination aux paramètres
        const [donations] = await db.query(finalSql, [...queryParams, limit, offset]);
         console.log(" donations ",totalResult);
        // 5. Réponse structurée
        res.status(200).json({
            success: true,
            data: donations,
            pagination: {
                totalItems,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit)
            }
        });

    } catch (error) {
        console.error('❌ Erreur API Donations:', error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};