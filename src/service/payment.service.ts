import axios from 'axios';
import { db } from '../config/db';
import { PaypalHelper } from './paypal.service';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

export class PaymentService {
    //   static async createPaypalOrderAndInitializePayment(
    //         orderData: any,
    //         userData: any,
    //         items: any[]
    //     ) {
    //         const tx_ref = `valala-${Date.now()}`;
    //         const email = userData?.email || "client@gmail.com";

    //         // 1️⃣ Enregistrement commande
    //         const [orderResult]: any = await db.execute(
    //             `INSERT INTO orders 
    //              (tx_ref, customer_email, total_amount, status, customer_name) 
    //              VALUES (?, ?, ?, 'pending', ?)`,
    //             [tx_ref, email, orderData.amount, userData?.name]
    //         );

    //         const orderId = orderResult.insertId;

    //         // 2️⃣ Enregistrement items
    //         for (const item of items) {
    //             await db.execute(
    //                 `INSERT INTO order_items 
    //                  (order_id, product_name, quantity, unit_price, product_id) 
    //                  VALUES (?, ?, ?, ?, ?)`,
    //                 [orderId, item.name, item.quantity, item.price, item.id]
    //             );
    //         }

    //         // 3️⃣ Création Order PayPal
    //         const token = await PaypalHelper.getAccessToken();
    //         console.log("log mon token : ",token);

    //         const paypalResponse = await axios.post(
    //             `https://api-m.sandbox.paypal.com/v2/checkout/orders`,
    //             {
    //                 intent: "CAPTURE",
    //                 purchase_units: [
    //                     {
    //                         reference_id: tx_ref,
    //                         amount: {
    //                             currency_code: "EUR",
    //                             value: parseFloat(orderData.amount).toFixed(2)
    //                         }
    //                     }
    //                 ],
    //                       application_context: {
    //           brand_name: "Valala Pay",
    //           shipping_preference: "NO_SHIPPING", // Supprime l'exigence d'adresse
    //           user_action: "PAY_NOW" // Change le bouton final en "Payer maintenant"
    //       }
    //             },
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                     "Content-Type": "application/json"
    //                 }
    //             }
    //         );
    //         console.log(paypalResponse.data);


    //         // 4️⃣ Lien de paiement PayPal
    //         const approvalLink = paypalResponse.data.links.find(
    //             (l: any) => l.rel === "approve"
    //         )?.href;

    //         // (optionnel) sauvegarder paypal_order_id
    //         await db.execute(
    //             `UPDATE orders SET transaction_id = ? WHERE id = ?`,
    //             [paypalResponse.data.id, orderId]
    //         );

    //         // 5️⃣ Retour au frontend
    //         return {
    //         id: paypalResponse.data.id
    //         };
    //     }

    // ✅ 1️⃣ Enregistrer la commande APRÈS approbation PayPal (appelé dans onApprove)
    static async saveOrderFromPaypal(orderData: any) {
        try {
            const { orderID, amount, user, items } = orderData;
            const tx_ref = `valala-${Date.now()}`;
            const email = user?.email || "client@gmail.com";

            console.log(`📝 Enregistrement de la commande pour orderID: ${orderID}`);

            // Enregistrer la commande dans la DB
            const [orderResult]: any = await db.execute(
                `INSERT INTO orders 
                 (tx_ref, transaction_id, customer_email, total_amount, status, customer_name) 
                 VALUES (?, ?, ?, ?, 'pending', ?)`,
                [tx_ref, orderID, email, amount, user?.name]
            );

            const orderId = orderResult.insertId;

            // Enregistrer les items
            for (const item of items) {
                await db.execute(
                    `INSERT INTO order_items 
                     (order_id, product_name, quantity, unit_price, product_id) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.name, item.quantity, item.price, item.id]
                );
            }

            console.log(`✅ Commande ${orderId} enregistrée avec succès`);

            return {
                success: true,
                orderId,
                tx_ref
            };

        } catch (error: any) {
            console.error("❌ Erreur lors de l'enregistrement:", error);
            throw new Error(`Échec d'enregistrement: ${error.message}`);
        }
    }

    // ✅ 2️⃣ Capturer le paiement PayPal et mettre à jour le statut
    static async checkStatusPaypalPayment(paypalOrderId: string) {
        try {
            const token = await PaypalHelper.getAccessToken();

            console.log(`📦 Capture du paiement pour orderID: ${paypalOrderId}`);

            // Capturer le paiement sur PayPal
            const capture = await axios.post(
                `${process.env.PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log("✅ Réponse capture PayPal:", capture.data.status);
            console.log("Détails capture:", JSON.stringify(capture.data, null, 2));

            // Vérifier si la capture a réussi
            if (capture.data.status === "COMPLETED") {

                // Mettre à jour le statut dans la DB en utilisant le transaction_id (orderID)
                const [updateResult]: any = await db.execute(
                    `UPDATE orders SET status = 'paid' WHERE transaction_id = ?`,
                    [paypalOrderId]
                );

                if (updateResult.affectedRows === 0) {
                    console.warn(`⚠️ Aucune commande trouvée avec transaction_id: ${paypalOrderId}`);
                } else {
                    console.log(`✅ Statut mis à jour pour la commande ${paypalOrderId}`);
                }

                return {
                    success: true,
                    status: capture.data.status,
                    orderID: capture.data.id,
                    captureID: capture.data.purchase_units[0]?.payments?.captures?.[0]?.id,
                    payer: {
                        email: capture.data.payer?.email_address,
                        name: capture.data.payer?.name?.given_name + ' ' + capture.data.payer?.name?.surname
                    }
                };

            } else {
                // Si le statut n'est pas COMPLETED
                console.error(`❌ Statut de capture inattendu: ${capture.data.status}`);

                return {
                    success: false,
                    status: capture.data.status,
                    message: "Le paiement n'a pas été complété"
                };
            }

        } catch (error: any) {
            console.error("❌ Erreur lors de la capture PayPal:");
            console.error("Message:", error.message);
            console.error("Réponse:", error.response?.data);

            // Gestion des erreurs spécifiques PayPal
            if (error.response?.data?.name === "UNPROCESSABLE_ENTITY") {
                throw new Error("Cette commande a déjà été capturée");
            }

            throw new Error(`Échec de la capture: ${error.response?.data?.message || error.message}`);
        }
    }

    // ✅ 3️⃣ (OPTIONNEL) Méthode pour récupérer les détails d'une commande
    static async getOrderDetails(paypalOrderId: string) {
        try {
            const token = await PaypalHelper.getAccessToken();

            const response = await axios.get(
                `${process.env.PAYPAL_API}/v2/checkout/orders/${paypalOrderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            return response.data;

        } catch (error: any) {
            console.error("❌ Erreur récupération détails:", error.response?.data);
            throw error;
        }
    }

    // ✅ 4️⃣ (ANCIEN CODE - Peut être supprimé si vous n'en avez plus besoin)
    // Cette méthode créait l'ordre côté serveur, mais maintenant c'est fait côté client
    static async createPaypalOrderAndInitializePayment(
        orderData: any,
        userData: any,
        items: any[]
    ) {
        // ⚠️ Cette méthode n'est plus nécessaire avec la nouvelle approche
        // Vous pouvez la garder pour référence ou la supprimer
        console.warn("⚠️ Cette méthode est obsolète avec la nouvelle approche client-side");

        // Ancien code conservé pour référence...
    }

    static async createOrderAndInitializePayment(orderData: any, userData: any, items: any[]) {
        const tx_ref = `valala-${Date.now()}`;
        const email = userData?.email || "client@gmail.com";
        let headerSecret = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-d39bd906a10da08e3b776187966a286a-X'
        // 1. Transaction DB (Enregistrement de la commande)
        const [orderResult]: any = await db.execute(
            `INSERT INTO orders (tx_ref, customer_email, total_amount, status, customer_name) VALUES (?, ?, ?, 'pending', ?)`,
            [tx_ref, email, orderData.amount, userData?.name]
        );

        const orderId = orderResult.insertId;

        // 2. Enregistrement des items
        for (let item of items) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_name, quantity, unit_price, product_id) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.name, item.quantity, item.price, item.id]
            );
        }

        // 3. Appel Flutterwave
        const response = await axios.post(
            'https://api.flutterwave.com/v3/payments',
            {
                tx_ref,
                amount: orderData.amount,
                currency: "EUR",
                redirect_url: "http://localhost:4200/payment/success",
                customer: { email },
                customizations: { title: "Valala Pay" }
            },
            {
                headers: {
                    Authorization: `Bearer ${headerSecret}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(response.data);

        return response.data;
    }


    static async createStripeOrderAndInitializePayment(token: any, orderData: any, userData: any, items: any[]) {
        const tx_ref = `valala-${Date.now()}`;
        const email = userData?.email || "client@gmail.com";
        let orderId;

        try {
            // 1. Création de la commande en base de données
            const [orderResult]: any = await db.execute(
                `INSERT INTO orders (tx_ref, customer_email, total_amount, status, customer_name) VALUES (?, ?, ?, 'pending', ?)`,
                [tx_ref, email, orderData, userData?.name]
            );
            orderId = orderResult.insertId;

            // 2. Enregistrement des items
            for (let item of items) {
                await db.execute(
                    `INSERT INTO order_items (order_id, product_name, quantity, unit_price, product_id) VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.name, item.quantity, item.price, item.id]
                );
            }

            // 3. Initialisation de Stripe Payment Intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(orderData * 100),
                currency: "eur",
                receipt_email: email,
                payment_method_data: {
                    type: 'card',
                    card: { token: token }
                },
                metadata: { order_id: orderId, tx_ref: tx_ref },
                confirm: true,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                }
            } as any);

            return {
                status: 'success',
                clientSecret: paymentIntent.client_secret,
                orderId: orderId,
                id: paymentIntent.id,
                tx_ref: tx_ref
            };

        } catch (err: any) {
            console.error("Erreur détectée lors du paiement:", err.type);

            // Si la commande a été créée, on met à jour son statut en 'failed'
            if (orderId) {
                await db.execute(`UPDATE orders SET status = 'failed' WHERE id = ?`, [orderId]);
            }

            // --- DISTINCTION DES ERREURS ---
            switch (err.type) {
                case 'StripeCardError':
                    // Erreur "Client" (Carte refusée, fonds insuffisants, expirée...)
                    throw {
                        type: 'PAYMENT_ERROR',
                        message: err.message,
                        decline_code: err.decline_code
                    };

                case 'StripeInvalidRequestError':
                    // Erreur "Développeur" (Mauvais paramètres, montant invalide...)
                    throw {
                        type: 'TECHNICAL_ERROR',
                        message: "Paramètres de paiement invalides."
                    };

                default:
                    // Autres erreurs (Connexion, Serveur Stripe, etc.)
                    throw {
                        type: 'SERVER_ERROR',
                        message: "Le service de paiement est temporairement indisponible."
                    };
            }
        }
    }
    static async processGooglePay(paymentData: any, userData: any, items: any[]) {
        const { token, amount } = paymentData;
        const tx_ref = `valala-gpay-${Date.now()}`;
        const email = userData?.email || "client@gmail.com";
        const headerSecret = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-d39bd906a10da08e3b776187966a286a-X';

        // 1. Transaction DB (Enregistrement de la commande)
        const [orderResult]: any = await db.execute(
            `INSERT INTO orders (tx_ref, customer_email, total_amount, status, customer_name) VALUES (?, ?, ?, 'pending', ?)`,
            [tx_ref, email, amount, userData?.name]
        );

        const orderId = orderResult.insertId;

        // 2. Enregistrement des items
        for (let item of items) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_name, quantity, unit_price, product_id) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.name, item.quantity, item.price, item.id]
            );
        }

        // 3. Appel Flutterwave spécifique pour Google Pay
        // Notez l'URL différente : /charges?type=googlepay
        const response = await axios.post(
            'https://api.flutterwave.com/v3/charges?type=googlepay',
            {
                token, // Le jeton reçu d'Angular
                tx_ref,
                amount,
                currency: "EUR",
                email,
                fullname: userData?.name || "Client Valala"
            },
            {
                headers: {
                    Authorization: `Bearer ${headerSecret}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    }



    static async process2Checkout(token: any, orderData: any, userData: any) {
        const sellerId = 'VOTRE_CODE_MARCHAND';
        const secretKey = 'VOTRE_CLE_SECRETE';

        const payload = {
            "SellerId": sellerId,
            "Currency": "EUR",
            "Amount": orderData.amount,
            "Source": token, // Le token généré par le frontend
            "BillingDetails": {
                "FirstName": userData.firstName,
                "LastName": userData.lastName,
                "Email": userData.email,
                "CountryCode": "MG", // Madagascar est accepté ici !
            },
            "Items": [
                { "Name": "Commande Valala", "Quantity": 1, "Price": orderData.amount }
            ]
        };

        const response = await axios.post(
            'https://api.2checkout.com/rest/6.0/orders/',
            payload,
            {
                headers: {
                    'X-Avangate-Authentication': `code="${sellerId}" key="${secretKey}"`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        return response.data;
    }
    static async confirmOrder(paymentIntentId: string) {
        try {
            // On demande à Stripe l'état réel du paiement pour éviter la fraude
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
            console.log(intent);

            if (intent.status === 'succeeded') {
                const orderId = intent.metadata.order_id;
                console.log(orderId);

                const [resultOrderUpdate] = await db.execute(
                    `UPDATE orders SET status = 'paid' WHERE id = ?`,
                    [orderId]
                );
                console.log('checko and  update order ok ', resultOrderUpdate);
                // Cette requête rejoint la table des détails de commande pour savoir quoi déduire
                const updateStockQuery = `
            UPDATE products p
            JOIN order_items oi ON p.id = oi.product_id
            SET p.stock = p.stock - oi.quantity
            WHERE oi.order_id = ?
        `;

                const [result] = await db.execute(updateStockQuery, [orderId]);
                console.log('checko and  update ok ', result);


                return { success: true };
            }
        } catch (error) {
            console.log("error ceck status ", error);

        }

        throw new Error("Paiement non validé");
    }
    static async handlePaymentSuccess(paymentIntent: any) {
        const orderId = paymentIntent.metadata.order_id;
        const stripePaymentId = paymentIntent.id;

        console.log(`Traitement du succès de paiement pour la commande : ${orderId}`);

        // Mise à jour du statut et enregistrement de l'ID de transaction Stripe pour la traçabilité
        const [result]: any = await db.execute(
            `UPDATE orders 
             SET status = 'paid', 
                 updated_at = NOW(),
                 payment_id = ? 
             WHERE id = ? AND status = 'pending'`,
            [stripePaymentId, orderId]
        );

        if (result.affectedRows === 0) {
            console.warn(`La commande ${orderId} est déjà payée ou n'existe pas.`);
        }

        return result;
    }

    static async createDonationAndInitializePayment(token: any, amount: number, userData: any) {
        const tx_ref = `don-${Date.now()}`;
        const email = userData?.email || "donateur@gmail.com";
        let donationId: number | null = null;

        try {
            // 1. Insertion initiale dans la table donations (statut pending)
            const [result]: any = await db.execute(
                `INSERT INTO donations 
            (donor_name, email, amount, currency, status, stripe_session_id) 
            VALUES (?, ?, ?, 'EUR', 'pending', ?)`,
                [userData?.name || 'Anonyme', email, amount, tx_ref]
            );
            donationId = result.insertId;

            // 2. Initialisation et Confirmation Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe veut des centimes
                currency: "eur",
                receipt_email: email,
                payment_method_data: {
                    type: 'card',
                    card: { token: token }
                },
                metadata: {
                    donation_id: donationId,
                    type: 'donation_valala'
                },
                confirm: true,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                }
            } as any);

            // 3. Si succès immédiat, on met à jour le statut et on garde le PaymentIntent ID
            if (paymentIntent.status === 'succeeded') {
                await db.execute(
                    `UPDATE donations SET status = 'complete', stripe_payment_intent = ? WHERE id = ?`,
                    [paymentIntent.id, donationId]
                );
            }

            return {
                status: 'success',
                donationId: donationId,
                stripeId: paymentIntent.id,
                paymentStatus: paymentIntent.status
            };

        } catch (err: any) {
            console.error("Erreur Don:", err.message);

            // En cas d'échec, on marque le don comme 'failed'
            if (donationId) {
                await db.execute(`UPDATE donations SET status = 'failed' WHERE id = ?`, [donationId]);
            }

            // Réutilisation de votre logique d'erreur personnalisée
            switch (err.type) {
                case 'StripeCardError':
                    // Erreur "Client" (Carte refusée, fonds insuffisants, expirée...)
                    throw {
                        type: 'PAYMENT_ERROR',
                        message: err.message,
                        decline_code: err.decline_code
                    };

                case 'StripeInvalidRequestError':
                    // Erreur "Développeur" (Mauvais paramètres, montant invalide...)
                    throw {
                        type: 'TECHNICAL_ERROR',
                        message: "Paramètres de paiement invalides."
                    };

                default:
                    // Autres erreurs (Connexion, Serveur Stripe, etc.)
                    throw {
                        type: 'SERVER_ERROR',
                        message: "Le service de paiement est temporairement indisponible."
                    };
            }
        }
    }

    static async confirmDonation(paymentIntentId: string) {
    try {
        // 1. Récupération de l'état réel auprès de Stripe (sécurité anti-fraude)
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (intent.status === 'succeeded') {
            // 2. Récupération de l'ID du don stocké dans les métadonnées lors de l'initialisation
            const donationId = intent.metadata.donation_id;

            if (!donationId) {
                console.error("Aucun donation_id trouvé dans les métadonnées Stripe");
                throw new Error("Données de transaction manquantes");
            }

            // 3. Mise à jour de la table donations
            // On passe le statut à 'complete' et on enregistre l'ID de paiement final
            const [result] = await db.execute(
                `UPDATE donations 
                 SET status = 'complete', stripe_payment_intent = ? 
                 WHERE id = ?`,
                [intent.id, donationId]
            );

            console.log(`Donation ${donationId} confirmée avec succès.`);
            
            return { 
                success: true, 
                donationId: donationId,
                amount: intent.amount / 100 // Retourne le montant en Euros pour le front-end
            };
        } else {
            console.warn(`Tentative de confirmation mais statut Stripe est : ${intent.status}`);
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du statut du don :", error);
        throw error;
    }

    throw new Error("Le paiement du don n'a pas pu être validé");
}


}
