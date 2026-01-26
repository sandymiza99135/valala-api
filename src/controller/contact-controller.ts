import { body, validationResult } from "express-validator";
import { Request, Response } from 'express';
import { transporter } from "../config/mail.config";
import { db } from "../config/db";

export const createCOntact= async (req: Request, res: Response) => {
    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      errors: errors.array() 
    });
  }

  const { name, phone, email, subject, message } = req.body;

  try {
    // Récupérer IP réelle (derrière proxy)
    const ipAddress = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.ip;

    // Insérer dans la base de données
    const [result] :any = await db.execute(
      `INSERT INTO contacts (name, phone, email, subject, message, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        phone, 
        email, 
        subject, 
        message, 
        ipAddress, 
        req.get('user-agent') || 'Unknown'
      ]
    );

    // Envoyer email de notification (optionnel)
    try {
      // Email à l'admin
      await transporter.sendMail({
        from: process.env.MAIL_USER_NAME || 'noreply@exemple.mg',
        to: process.env.ADMIN_EMAIL || 'admin@exemple.mg',
        subject: `Nouveau message de contact: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Nouveau message de contact</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Nom:</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${email}</td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Téléphone:</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Sujet:</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${subject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-left: 4px solid #7c3aed;">
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              IP: ${ipAddress} | User Agent: ${req.get('user-agent')}
            </p>
          </div>
        `
      });

      // Email de confirmation au client
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@exemple.mg',
        to: email,
        subject: 'Confirmation de réception de votre message',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Bonjour ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Nous avons bien reçu votre message concernant: <strong>${subject}</strong>
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Notre équipe vous répondra dans les plus brefs délais (sous 24h).
            </p>
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe</strong>
            </p>
          </div>
        `
      });
    } catch (emailError :any) {
      console.error('⚠️  Erreur envoi email:', emailError.message);
      // Continue même si l'email échoue
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('❌ Erreur base de données:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du message'
    });
  }
}