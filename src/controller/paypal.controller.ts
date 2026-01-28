import { PaymentService } from "../service/payment.service";
import { PaypalHelper } from "../service/paypal.service";
import { Request, Response } from 'express';
export const createPaypalSetupToken = async (req: Request, res: Response) => {
    try {
        const accessToken = await PaypalHelper.getAccessToken();
        console.log(accessToken);
        
        const response = await fetch('https://api-m.sandbox.paypal.com/v3/vault/setup-tokens', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                payment_source: {
                    paypal: {
                        usage_type: "MERCHANT",
                        experience_context: {
                            return_url: "http://localhost:4200/success",
                            cancel_url: "http://localhost:4200/cancel"
                        }
                    }
                }
            })
        });
        const data = await response.json();
        console.log(data );
        
        res.json(data); // Renvoie l'ID du Setup Token
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const completeVaultPurchase = async (req: Request, res: Response) => {
    try {
        const { vaultSetupToken, amount, user, items } = req.body;

        // 1. ÉCHANGE du Setup Token contre un Payment Token Permanent
        const accessToken = await PaypalHelper.getAccessToken();
        const vaultResponse = await fetch('https://api-m.sandbox.paypal.com/v3/vault/payment-tokens', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_source: {
                    token: {
                        id: vaultSetupToken,
                        type: "SETUP_TOKEN"
                    }
                }
            })
        });

        const vaultData = await vaultResponse.json();
        console.log("vaultData : ",vaultData);
        
        if (!vaultResponse.ok) {
            throw new Error(`Erreur PayPal Vault: ${vaultData.message}`);
        }

        // Le vrai jeton permanent est ici : vaultData.id
        const permanentToken = vaultData.id; 

        // 2. ENREGISTREMENT avec le token permanent
        const result = await PaymentService.saveOrderAndVault({
            vaultToken: permanentToken, // On enregistre le PT-XXXX au lieu du ST-XXXX
            amount,
            user,
            items
        });

        res.json(result);
    } catch (error: any) {
        console.error("Erreur finalisation Vault:", error);
        res.status(500).json({ error: error.message });
    }
};