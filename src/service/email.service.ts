import nodemailer from 'nodemailer';
import { transporter } from '../config/mail.config';

interface EmailOptions {
    to: string | string[]; // Accepte un seul email ou un tableau
    subject: string;
    html: string;
}

export class EmailService {
    static async send(options: EmailOptions): Promise<void> {
        try {
            // Si c'est un tableau d'admins, on les transforme en chaîne séparée par des virgules
            const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

            const mailOptions = {
                from: `"Association Valala" <${process.env.EMAIL_USER}>`,
                to: recipients,
                subject: options.subject,
                html: options.html,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email envoyé: %s', info.messageId);
        } catch (error) {
            console.error('❌ Erreur EmailService:', error);
            throw new Error('Impossible d\'envoyer l\'email.');
        }
    }
}