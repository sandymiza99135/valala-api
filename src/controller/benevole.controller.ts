import { Request, Response } from 'express';
import { db } from '../config/db';
import { transporter } from '../config/mail.config';
export const subscribeToBenevolat = async (req: Request, res: Response) => {
    const { full_name, email, phone, interest_area, message } = req.body;
    try {
        await db.query(
            'INSERT INTO volunteer_leads (full_name, email, phone, interest_area, message) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone, interest_area, message]
        );
        const mailOptions = {
            from: process.env.MAIL_USER_NAME,
            to: process.env.ADMIN_EMAIL, // L'email qui recevra les alertes
            subject: `NOUVEAU BÉNÉVOLE : ${full_name}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #f97316;">Nouvelle demande de bénévolat !</h2>
                    <p><strong>Nom :</strong> ${full_name}</p>
                    <p><strong>Email :</strong> ${email}</p>
                    <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
                    <p><strong>Secteur d'intérêt :</strong> ${interest_area}</p>
                    <p><strong>Message :</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message || 'Pas de message particulier.'}</div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <small>Ceci est un message automatique généré depuis le site web.</small>
                </div>
            `
        };

        // 4. Envoi effectif
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Merci ! Nous vous recontacterons très vite." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
    }

}