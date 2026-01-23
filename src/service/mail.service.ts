import { transporter } from "../config/mail.config";

export class MailService {
    static async sendPurchaseEmail(data: { email: string, name: string, amount: number, orderId: any, transactionId: string }) {
    try {
        await transporter.sendMail({
            from: `"Ma Boutique" <${process.env.MAIL_USER_NAME}>`,
            to: data.email,
            subject: `Confirmation de votre commande #${data.orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Merci pour votre achat !</h1>
                    </div>
                    
                    <div style="padding: 20px; color: #333;">
                        <p>Bonjour <strong>${data.name}</strong>,</p>
                        <p>Bonne nouvelle ! Votre paiement a été validé avec succès. Nous préparons actuellement votre commande.</p>
                        
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #2c3e50;">Récapitulatif de la commande</h3>
                            <p style="margin: 5px 0;"><strong>N° de commande :</strong> ${data.orderId}</p>
                            <p style="margin: 5px 0;"><strong>Montant total :</strong> ${data.amount} €</p>
                            <p style="margin: 5px 0;"><strong>ID Transaction :</strong> <small style="color: #666;">${data.transactionId}</small></p>
                        </div>
                        
                        <p>Vous recevrez un nouvel email dès que votre colis sera expédié.</p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.9em; color: #7f8c8d; text-align: center;">
                            Si vous avez des questions, n'hésitez pas à répondre à cet email.<br>
                            <strong>L'équipe Ma Boutique</strong>
                        </p>
                    </div>
                </div>
            `
        });
        console.log(`✉️ Mail de confirmation envoyé à ${data.email}`);
    } catch (error) {
        console.error("Impossible d'envoyer le mail d'achat:", error);
    }
}
    static async successDonation(don: any) {
    // 1. Vérification de sécurité
    if (!don || don.length === 0) {
        console.error("Erreur: Aucune donnée de don fournie pour l'envoi du mail.");
        return;
    }

    const data = don[0];

    // 2. Formatage propre de la date
    const dateDon = data.created_at 
        ? new Date(data.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : "récemment";

    try {
        const info = await transporter.sendMail({
            from: `"Valala Association" <${process.env.MAIL_USER_NAME}>`,
            to: data.email,
            subject: `Confirmation de réception de votre don - Merci !`,
            text: `Bonjour ${data.donor_name}, nous avons bien reçu votre don de ${data.amount} €.`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #27ae60; margin-bottom: 10px;">Merci pour votre générosité !</h1>
                    </div>
                    
                    <p>Bonjour <strong>${data.donor_name}</strong>,</p>
                    
                    <p>Nous vous confirmons avec joie avoir reçu votre don de <span style="font-size: 1.2em; color: #27ae60; font-weight: bold;">${data.amount} €</span> effectué le ${dateDon}.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 0.9em;"><strong>Référence du paiement :</strong><br>
                        <code style="color: #7f8c8d;">${data.stripe_payment_intent || data.paypal_order_id || 'N/A'}</code></p>
                    </div>

                    <p>Grâce à votre soutien, l'équipe Valala peut continuer ses actions. Chaque don compte énormément pour nous.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="text-align: center; color: #7f8c8d; font-size: 0.8em;">
                        Ceci est un message automatique, merci de ne pas y répondre directement.<br>
                        <strong>L'équipe Valala</strong>
                    </p>
                </div>
            `,
        });

        console.log(`✅ Email de remerciement envoyé à: ${data.email} (ID: ${info.messageId})`);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi du mail de donation:", error);
    }
}
}