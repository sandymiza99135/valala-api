import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';
import { transporter } from '../config/mail.config';
import { db } from '../config/db';
import { EmailService } from '../service/email.service';
import { DonService } from '../service/don.service';
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
export const initializePaypalPayment = async (req: Request, res: Response) => {
     try {
        console.log(req.body);
        
        const { orderID, amount, user } = req.body;

        // Validation
        if (!orderID || !amount || !user) {
            return res.status(400).json({ 
                error: 'Données manquantes',
                required: ['orderID', 'amount', 'user', 'items']
            });
        }

        const result = await PaymentService.saveDonOrderFromPaypal(
            orderID,
            amount,
            user
        );

        res.json(result);

    } catch (error: any) {
        console.error('Erreur save-order:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
  
};

export const checkPaypalPaymentStatus = async (req: Request, res: Response) => {
    try {
          const id = req.params.id;
          console.log("orderId paypal : ",id);
          
       
        const paymentData = await PaymentService.checkStatusDonPaypalPayment(id
        );
        console.log(paymentData);
        
        res.json(paymentData);

    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
};

export const createMaterialDonation = async (req: Request, res: Response) => {
    try {
        const { firstName ,lastName, email, items, appointmentType, scheduledAt, address } = req.body;

        if (!items || !scheduledAt || !appointmentType) {
            return res.status(400).json({ error: "Informations de livraison manquantes" });
        }
        const name = `${firstName} ${lastName}`;
        // 1. Sauvegarde en base de données
        const result = await DonService.saveMaterialDonation({
            name, email, items, appointmentType, scheduledAt, address
        });

        // 2. Gestion des destinataires admin (séparés par '|')
        const adminEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split('|') : [];

        // 3. Préparation des contenus (Template simple)
        const dateFormatted = new Date(scheduledAt).toLocaleString('fr-FR');
        const typeLabel = appointmentType === 'pickup' ? 'Récupération à domicile' : 'Dépôt au centre';

        const emailContent = `
            <h3>Nouveau don matériel reçu !</h3>
            <p><strong>Donneur:</strong> ${name} (${email})</p>
            <p><strong>Matériel:</strong> ${items}</p>
            <p><strong>Mode:</strong> ${typeLabel}</p>
            <p><strong>Date prévue:</strong> ${dateFormatted}</p>
            <p><strong>Adresse:</strong> ${address || 'Non spécifiée'}</p>
        `;

        // 4. Envoi des mails (Asynchrone mais on n'attend pas forcément pour répondre au client)
        try {
            // Mail à l'Admin (ou aux admins)
            if (adminEmails.length > 0) {
                await EmailService.send({
                    to: adminEmails, // La plupart des services acceptent un tableau d'emails
                    subject: "🔔 Nouvelle proposition de don matériel",
                    html: emailContent
                });
            }

            // Mail de confirmation au Donneur
            await EmailService.send({
                to: email,
                subject: "Merci pour votre don - Association Valala",
                html: `
                    <h1>Merci ${name} !</h1>
                    <p>Votre proposition de don matériel a bien été enregistrée.</p>
                    <p>Notre équipe va examiner votre demande pour le créneau du <strong>${dateFormatted}</strong>.</p>
                    <p>À très bientôt !</p>
                `
            });
        } catch (mailError) {
            console.error('Erreur envoi email:', mailError);
            // On ne bloque pas la réponse 201 si seul l'email échoue
        }

        return res.status(201).json(result);

    } catch (error: any) {
        console.error('Material Donation Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
// 1. Récupérer tous les dons (Admin)
export const getMaterialDonations = async (req: Request, res: Response) =>{
    try {
        // 1. Récupération et typage des paramètres
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        console.log(page ,limit ,offset);
        
        
        const search = (req.query.search as string) || ''; 
        const status = (req.query.status as string) || '';
        const appointmentType = (req.query.appointmentType as string) || ''; // Optionnel: filtre pickup/drop_off

        // 2. Construction dynamique de la clause WHERE
        let queryParams: any[] = [];
        let whereClauses: string[] = [];

        if (search.trim()) {
            whereClauses.push(`(donor_name LIKE ? OR email LIKE ?)`);
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (status.trim()) {
            whereClauses.push(`status = ?`);
            queryParams.push(status);
        }

        if (appointmentType.trim()) {
            whereClauses.push(`appointment_type = ?`);
            queryParams.push(appointmentType);
        }

        // On construit le WHERE seulement s'il y a des filtres
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 3. Requête COUNT (On utilise SEULEMENT queryParams ici)
        const [totalResult]: any = await db.execute(
            `SELECT COUNT(*) as total FROM material_donations ${whereSql}`,
            queryParams
        );
        const totalItems = totalResult[0].total;

        // 4. Requête principale (On ajoute limit et offset à la FIN du tableau)
        // Note: Utilise db.query ou db.execute, mais assure-toi que limit/offset sont des numbers
        const finalSql = `SELECT * FROM material_donations ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        console.log(...queryParams);
        
        const [donations]: any = await db.query(finalSql, [...queryParams, limit, offset]);

        // 5. Réponse structurée
        return res.status(200).json({
            success: true,
            data: donations,
            pagination: {
                totalItems,
                currentPage: page,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit)
            }
        });

    } catch (error: any) {
        console.error('❌ Erreur API Material Donations:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur serveur",
            error: error.message 
        });
    }
};

// 2. Mettre à jour le statut et envoyer l'accusé de réception
export const acknowledgeReceipt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // ex: 'received'

        const donation = await DonService.updateMaterialStatus(parseInt(id), status);

        if (!donation) {
            return res.status(404).json({ error: "Don non trouvé" });
        }

        // Si le statut passe à 'received', on envoie l'accusé de réception
        if (status === 'received') {
            await EmailService.send({
                to: donation.email,
                subject: "Accusé de réception - Votre don a bien été reçu !",
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6;">
                        <h2 style="color: #D94141;">Accusé de réception</h2>
                        <p>Cher(e) <strong>${donation.donor_name}</strong>,</p>
                        <p>Nous avons le plaisir de vous informer que nous avons officiellement réceptionné votre don :</p>
                        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #FFB347;">
                            ${donation.item_description}
                        </blockquote>
                        <p>Grâce à votre générosité, nous allons pouvoir poursuivre nos actions à Belo sur Tsiribihina.</p>
                        <p>Un grand merci de la part de toute l'équipe de l'Association Valala.</p>
                        <br>
                        <small>ID du don : #MAT-${donation.id}</small>
                    </div>
                `
            });
        }

        return res.status(200).json({ message: "Statut mis à jour et email envoyé", donation });
    } catch (error: any) {
        console.error('Update Status Error:', error);
        return res.status(500).json({ error: error.message });
    }
};