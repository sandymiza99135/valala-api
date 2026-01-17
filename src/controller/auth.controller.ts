import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import crypto from 'crypto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { transporter } from '../config/mail.config';
const CLIENT_ID = '96931574842-lov870nsgigetaop3oco6k825v2i028s.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const JWT_SECRET = 'jwt';
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        // Vérification si le compte existe
        if (!user) {
            return res.status(401).json({ status :401,message: "Identifiants invalides" });
        }

        // Cas critique : Compte créé via Google sans mot de passe défini
        if (!user.password && user.google_id) {
            return res.status(403).json({ status :401,
                message: "Ce compte utilise la connexion Google. Veuillez vous connecter via Google ou réinitialiser votre mot de passe." 
            });
        }

        // Vérification du mot de passe et du statut vérifié
        if (!(await bcrypt.compare(password, user.password)) || !user.is_verified) {
            return res.status(401).json({status :401, message: "Identifiants invalides ou compte non activé" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.json({
            status :200,
            token: token,
            user: { id: user.id, name: user.name, email: user.email ,role : user.role}
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const loginGoogle = async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub) {
            return res.status(401).json({status :401, error: 'Payload Google invalide' });
        }

        const { sub: googleId, email, name, picture } = payload;

        // 1. Chercher d'abord par google_id OU par email
        const [rows]: any = await db.query(
            'SELECT * FROM users WHERE google_id = ? OR email = ?', 
            [googleId, email]
        );

        let user = rows[0];

        if (!user) {
            // Cas A : L'utilisateur n'existe pas du tout -> Création
            const [result]: any = await db.query(
                'INSERT INTO users (google_id, email, name, picture, is_verified) VALUES (?, ?, ?, ?, ?)',
                [googleId, email, name, picture, true] // Google est déjà vérifié
            );
            user = { id: result.insertId, email, name, picture };
        } else if (!user.google_id) {
            // Cas B : Le compte existait via email/pass -> On ajoute le google_id pour synchroniser
            await db.query(
                'UPDATE users SET google_id = ?, picture = ?, is_verified = ? WHERE id = ?',
                [googleId, picture, true, user.id]
            );
        }

        const appToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({status :200,
            token: appToken,
            user: { id: user.id, name: user.name, email: user.email, picture: user.picture }
        });

    } catch (error) {
        res.status(401).json({ status :401,error: 'Authentification Google échouée' });
    }
};
export const register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    try {
        // Vérifier si l'email existe déjà
        const [existing]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        console.log(existing);
        
        if (existing.length > 0) {
            const user = existing[0];
            if (user.google_id && !user.password) {
                return res.status(400).json({ message: "Un compte Google existe déjà avec cet email. Connectez-vous via Google." });
            }
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (email, password, name, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, name, verificationToken, false]
        );

        // ... code d'envoi de mail ...
        res.status(201).json({ status : 200 ,message: "Utilisateur créé. Vérifiez vos emails ! pour finir l' activation" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription" });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
   const { token } = req.params;

    try {
        // 1. Trouver l'utilisateur avec ce token
        const [rows]: any = await db.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        
        if (rows.length === 0) {
            return res.status(400).send("Lien de vérification invalide ou expiré.");
        }

        // 2. Mettre à jour l'utilisateur
        await db.query(
            'UPDATE users SET is_verified = ?, verification_token = NULL WHERE id = ?',
            [true, rows[0].id]
        );

        // 3. Rediriger vers la page de login Angular
        res.redirect('http://localhost:4200/auth/login?verified=true');

    } catch (error) {
        res.status(500).send("Erreur lors de la vérification.");
    }
};