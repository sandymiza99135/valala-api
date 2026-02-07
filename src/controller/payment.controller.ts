import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';
import { db } from '../config/db';
import Stripe from 'stripe';
import { transporter } from '../config/mail.config';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');
export const initializePayment = async (req: Request, res: Response) => {
    try {
        const { amount, user, items } = req.body;

        // Validation simple
        if (!amount || !items || items.length === 0) {
            return res.status(400).json({ error: "Montant et articles requis" });
        }


        const paymentData = await PaymentService.createOrderAndInitializePayment(
            { amount },
            user,
            items
        );
        console.log(paymentData);
        
        res.json(paymentData);
    } catch (error: any) {
        console.error("Erreur Paiement:", error.message);
        res.status(500).json({ error: "Impossible d'initialiser le paiement" });
    }
};
export const initializePaypalPayment = async (req: Request, res: Response) => {
     try {
        console.log(req.body);
        
        const { orderID, amount, user, items ,address ,phone} = req.body;
        user.address = address;
        user.phone = phone;
        // Validation
        if (!orderID || !amount || !user || !items) {
            return res.status(400).json({ 
                error: 'Données manquantes',
                required: ['orderID', 'amount', 'user', 'items']
            });
        }

        const result = await PaymentService.saveOrderFromPaypal({
            orderID,
            amount,
            user,
            items
        });

        res.json(result);

    } catch (error: any) {
        console.error('Erreur save-order:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
  
};
export const initializePaymentGpay = async (req: Request, res: Response) => {
    try {
        const { amount, user, items ,token} = req.body;

        // Validation simple
        if (!amount || !items || items.length === 0) {
            return res.status(400).json({ error: "Montant et articles requis" });
        }
        

        const paymentData = await PaymentService.processGooglePay(
            { token ,amount },
            user,
            items
        );

        res.json(paymentData);
    } catch (error: any) {
        console.error("Erreur Paiement:", error);
        res.status(500).json({ error: "Impossible d'initialiser le paiement" });
    }
};
export const getWebhookReturnPayment = async (req: Request, res: Response) => {
   const payload = req.body;
   //console.log('repon  ',payload);
   
    // Flutterwave envoie plusieurs types d'événements, on vérifie que c'est bien un succès
    if (payload.status === 'successful') {
        
        try {
            console.log( [payload.id, payload]);
            
            // 1. Mise à jour de la table 'orders'
            const [result] :any = await db.execute(
                `UPDATE orders 
                 SET status = 'paid', 
                     transaction_id = ?, 
                     updated_at = NOW() 
                 WHERE tx_ref = ? AND status = 'pending'`,
                [payload.id, payload.txRef] // payload.id est l'ID Flutterwave
            );
            console.log(result);
            
11
            if (result.affectedRows > 0) {
                console.log(`✅ Commande ${payload.tx_ref} mise à jour avec succès.`);
                
                // OPTIONNEL : Vous pouvez ici envoyer un email ou déclencher une action de livraison
            } else {
                console.log(`⚠️ Commande ${payload.tx_ref} non trouvée ou déjà payée.`);
            }

        } catch (error) {
            console.error("❌ Erreur SQL :", error);
            // On renvoie 200 quand même pour éviter que Flutterwave ne renvoie le webhook sans cesse
        }
    }

    // Toujours renvoyer 200 à Flutterwave
    res.status(200).end();
};
export const getAllOrderPayment = async (req: Request, res: Response) => {
     try {
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 10;
    const search = req.body.search as string || '';
    const status = req.body.status as string || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT * 
      FROM orders o 
      WHERE o.customer_email LIKE ? 
    `;
    let queryCount = 'SELECT COUNT(*) as count FROM orders WHERE customer_email LIKE ?' 
    let params: any[] = [`%${search}%` || '%%'];

    // Ajouter le filtre catégorie si présent
    if (status) {

      query += ` AND o.status = ? `;
      queryCount += ` AND status = ? `;
      params.push(status);
    }
    const [total]: any = await db.query(queryCount, params);
    // Ajouter la pagination
    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [products]: any = await db.query(query, params);
    // Récupérer le total pour calculer le nombre de pages côté Angular
    

    res.json({
      data: products,
      total: total[0].count,
      currentPage: page,
      totalPages: Math.ceil(total[0].count / limit)
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
        console.log(req.params);
        
        const { tx_ref } = req.params;
        console.log(tx_ref);
        
        // 1. Chercher la commande en base de données
        const [orders]: any = await db.execute(
            'SELECT status FROM orders WHERE tx_ref = ?', 
            [tx_ref]
        );

        if (orders.length === 0) {
            return res.status(404).json({ status: 'not_found' });
        }

        const order = orders[0];

        // 2. Si le webhook est déjà passé, le statut sera 'completed' ou 'success'
        if (order.status === 'paid') {
            return res.json({ status: 'success' });
        }

        // 3. OPTIONNEL : Si le webhook tarde trop, on interroge Flutterwave en direct
        // C'est une sécurité supplémentaire
        // const response = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, ...);

        res.json({ status: 'pending' });

    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
};
export const checkPaypalPaymentStatus = async (req: Request, res: Response) => {
    try {
          const id = req.params.id;
          console.log("orderId paypal : ",id);
          
       
        const paymentData = await PaymentService.checkStatusPaypalPayment(id
        );
        console.log(paymentData);
        
        res.json(paymentData);

    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
};

export const createPaymentStripe = async (req: Request, res: Response) => {
    try {
        const { amount, user, items ,token} = req.body;
        console.log({ amount, user, items });
        
        const result = await PaymentService.createStripeOrderAndInitializePayment(
            token,
            amount, 
            user, 
            items
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
export const CheckPaymentStripe = async (req: Request, res: Response) => {
    try {
        const paymentIntentId : any  = req.query.paymentIntentId;
       
        
        const result = await PaymentService.confirmOrder(paymentIntentId);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Stripe Init Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
export  const changeDeliveryStatus = async  (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { delivery_status } = req.body;

    try {
        // 1. Récupérer les infos de la commande (notamment l'email du client)
        const order : any = await db.query(
                `select * from orders 
               WHERE id = ?`,
                [orderId] // payload.id est l'ID Flutterwave
            );

        console.log(order[0][0]);
        
        if (!order) return res.status(404).json({ message: "Commande non trouvée." });

        const oldStatus = order.delivery_status;

        // 2. Mise à jour en base de données
        await db.query(
                 `UPDATE orders 
                 SET delivery_status = ?, 
                     updated_at = NOW() 
                 WHERE id = ?`,
                [delivery_status,orderId] // payload.id est l'ID Flutterwave
            );

        // 3. LOGIQUE D'ENVOI DE MAIL : Si on passe à 'delivered'
        if (delivery_status === 'delivered' && oldStatus !== 'delivered') {
            const mailOptions = {
                from: process.env.MAIL_USER_NAME,
                to: order[0][0].customer_email, // L'email stocké dans votre table orders
                subject: 'Votre colis est arrivé ! 📦',
                html: `
                    <h1>Bonjour ${order[0][0].customer_name},</h1>
                    <p>Bonne nouvelle ! Votre commande <strong>#${order[0][0].id}</strong> a été livrée avec succès.</p>
                    <p>Merci de votre soutien à notre association.</p>
                    <br>
                    <p>À bientôt !</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) console.log("Erreur mail:", error);
                else console.log("Email de confirmation envoyé à: " + order.email);
            });
        }

        res.json({ success: true, message: "Statut mis à jour et mail envoyé si livré." });

    } catch (error) {
        console.error(error);
        
        res.status(500).json({ message: "Erreur serveur." });
    }
}

    
// export  const stripeWebhook = async (req: Request, res: Response) =>{
//         const sig :any = req.headers['stripe-signature'];
//         const endpointSecret  :any= process.env.STRIPE_WEBHOOK_SECRET;
//         let event;

//         try {
//             // CRUCIAL : Utilisez req.body en format RAW (Buffer)
//             event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//         } catch (err: any) {
//             console.error(`Erreur de signature Webhook : ${err.message}`);
//             return res.status(400).send(`Webhook Error: ${err.message}`);
//         }

//         // Router l'événement vers la bonne méthode de service
//         switch (event.type) {
//             case 'payment_intent.succeeded':
//                 const paymentIntent = event.data.object;
//                 await PaymentService.handlePaymentSuccess(paymentIntent);
//                 break;

//             case 'payment_intent.payment_failed':
//                 const failedIntent = event.data.object;
//                 console.log(`Échec de paiement pour la commande : ${failedIntent.metadata.order_id}`);
//                 // Optionnel : OrderService.handlePaymentFailure(failedIntent);
//                 break;

//             default:
//                 console.log(`Événement non géré : ${event.type}`);
//         }

//         // Répondre à Stripe que l'événement a bien été reçu
//         res.json({ received: true });
//     }
