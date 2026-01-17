// import express, { Request, Response } from 'express';
// import mysql from 'mysql2/promise'; // Version promise pour async/await
// import { OAuth2Client, TokenPayload } from 'google-auth-library';
// import jwt from 'jsonwebtoken';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import bcrypt from 'bcrypt';
// import crypto from 'crypto';
// import fs from 'fs';
// import path from 'path';
// dotenv.config();
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'rakotonindrinasandiarivelo@gmail.com',
//     pass: 'Point2vue' // Pas votre mot de passe habituel !
//   }
// });
// const app = express();
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // 2. Ensuite les autres middlewares (CORS, etc.)
// app.use(cors());

// // Permet d'accéder aux images via http://localhost:3000/uploads/products/image.jpg
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// const CLIENT_ID = '96931574842-lov870nsgigetaop3oco6k825v2i028s.apps.googleusercontent.com';
// const client = new OAuth2Client(CLIENT_ID);
// const JWT_SECRET = 'jwt';

// // Connexion MySQL typée
// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'valala',
//     waitForConnections: true
// });

// // Interface pour le corps de la requête
// interface AuthRequest {
//     token: string;
// }

// app.post('/api/auth/google', async (req: Request<{}, {}, AuthRequest>, res: Response) => {
//     const { token } = req.body;
 
    
//     try {
//         // 1. Vérification du Token Google
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID,
//         });
//            console.log(ticket);
//         const payload: TokenPayload | undefined = ticket.getPayload();

//         if (!payload || !payload.sub) {
//             return res.status(401).json({ error: 'Payload Google invalide' });
//         }

//         const { sub: googleId, email, name, picture } = payload;

//         // 2. Gestion de l'utilisateur dans MySQL
//         const [rows]: any = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);

//         let userId: number;
//         console.log("row ",rows);
        

//         if (rows.length === 0) {
//             const [result]: any = await db.query(
//                 'INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)',
//                 [googleId, email, name, picture]
//             );
//             userId = result.insertId;
//         } else {
//             userId = rows[0].id;
//         }

//         // 3. Signature du JWT local
//         const appToken = jwt.sign(
//             { id: userId, email: email }, 
//             JWT_SECRET, 
//             { expiresIn: '24h' }
//         );

//         res.json({
//             token: appToken,
//             user: { id: userId, name, email, picture }
//         });

//     } catch (error) {
//         console.error('Erreur Auth:', error);
//         res.status(401).json({ error: 'Authentification échouée' });
//     }
// });
// app.post('/api/auth/register', async (req, res) => {
//     const { email, password, name } = req.body;

//     try {
//         // 1. Vérifier si l'email existe déjà... (code précédent)

//         // 2. Générer un token unique
//         const verificationToken = crypto.randomBytes(32).toString('hex');
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // 3. Insérer l'utilisateur (is_verified = false par défaut)
//         await db.query(
//             'INSERT INTO users (email, password, name, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)',
//             [email, hashedPassword, name, verificationToken, false]
//         );

//         // 4. Envoyer le mail
//         const verificationLink = `http://localhost:3000/api/auth/verify/${verificationToken}`;

//         const mailOptions = {
//             from: '"Lieblings Association" <votre-email@gmail.com>',
//             to: email,
//             subject: 'Confirmez votre inscription',
//             html: `
//                 <h1>Bienvenue ${name} !</h1>
//                 <p>Merci de cliquer sur le lien ci-dessous pour activer votre compte :</p>
//                 <a href="${verificationLink}" style="padding: 10px 20px; background: #FF6B00; color: white; text-decoration: none; border-radius: 5px;">
//                     Activer mon compte
//                 </a>
//             `
//         };

//         await transporter.sendMail(mailOptions);
//         res.status(201).json({ message: "Utilisateur créé. Vérifiez vos emails !" });

//     } catch (error) {
//         res.status(500).json({ error: "Erreur lors de l'envoi du mail" });
//     }
// });
// app.post('/api/auth/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
//         const user = rows[0];

//         if (!user || !user.password) {
//             return res.status(401).json({ message: "Identifiants invalides" });
//         }

//         // Comparaison sécurisée
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(401).json({ message: "Identifiants invalides" });
//         }

//         // Génération du même type de JWT que pour Google
//         const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

//         res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
//     } catch (error) {
//         res.status(500).json({ error: "Erreur de connexion" });
//     }
// });
// app.get('/',  (req, res) => {
//     console.log("welcome to valala api");
    
//     res.send("welcome to valala api")
// })
// app.get('/api/auth/verify/:token', async (req, res) => {
//     const { token } = req.params;

//     try {
//         // 1. Trouver l'utilisateur avec ce token
//         const [rows]: any = await db.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        
//         if (rows.length === 0) {
//             return res.status(400).send("Lien de vérification invalide ou expiré.");
//         }

//         // 2. Mettre à jour l'utilisateur
//         await db.query(
//             'UPDATE users SET is_verified = ?, verification_token = NULL WHERE id = ?',
//             [true, rows[0].id]
//         );

//         // 3. Rediriger vers la page de login Angular
//         res.redirect('http://localhost:4200/auth/login?verified=true');

//     } catch (error) {
//         res.status(500).send("Erreur lors de la vérification.");
//     }
// });
// app.post('/api/product/add',async (req: Request, res: Response) => {
//   try {
//     const { name, description, price, stock, category_id, imageBase64 } = req.body;

//     // 1. Extraire l'extension et les données pures
//     // La string ressemble à : "data:image/png;base64,iVBOR..."
//     const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
//     if (!matches || matches.length !== 3) {
//       return res.status(400).json({ error: 'Format d\'image invalide' });
//     }

//     const extension = matches[1].split('/')[1]; // ex: 'png' ou 'jpeg'
//     const dataBuffer = Buffer.from(matches[2], 'base64');
    
//     // 2. Générer un nom de fichier unique
//     const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
//     const uploadPath = path.join(__dirname, '../uploads/products', fileName);

//     // 3. Écrire le fichier sur le disque
//     fs.writeFileSync(uploadPath, dataBuffer);

//     // 4. Enregistrer le CHEMIN (URL) dans MySQL
//     const imageUrl = `/uploads/products/${fileName}`;
//     const [result]: any = await db.query(
//       'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
//       [name, description, price, stock, category_id, imageUrl]
//     );

//     res.status(201).json({ message: 'Produit créé et image enregistrée !' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Erreur lors de l\'upload  : ' });
//   }
// });
// app.get('/api/category/all',async (req: Request, res: Response) => {
//     try{
//          let query = `
//             SELECT *
//             FROM categories`;
//         const [categories]: any = await db.query(query);
//         res.json({
//       data: categories
//     });
//     }catch (error) {
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
   
// })
// app.get('/api/product/:id',async (req: Request, res: Response) => {
//     try{
//          let query = `
//       SELECT p.*, c.name as category_name 
//       FROM products p 
//       LEFT JOIN categories c ON p.category_id = c.id 
//       WHERE p.id = ? 
//     `;
//        let params =[req.params.id]
//         const [products]: any = await db.query(query,params);
//         if (!products || products.length === 0) {
//             return res.status(404).json({ message: "Produit introuvable" });
//             }
//         res.json({
//       data: products[0]
//     });
//     }catch (error) {
//         console.log(error);
        
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
   
// })
// app.post('/api/product/all',async (req: Request, res: Response) => {
//   try {
//     const page = parseInt(req.body.page as string) || 1;
//     const limit = parseInt(req.body.limit as string) || 10;
//     const search = req.body.search as string || '';
//     const category = req.body.category as string || '';
//     const offset = (page - 1) * limit;

//     let query = `
//       SELECT p.*, c.name as category_name 
//       FROM products p 
//       LEFT JOIN categories c ON p.category_id = c.id 
//       WHERE p.name LIKE ? 
//     `;
//     let params: any[] = [`%${search}%` || '%%'];

//     // Ajouter le filtre catégorie si présent
//     if (category) {

//       query += ` AND c.name = ? `;
//       params.push(category);
//     }

//     // Ajouter la pagination
//     query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
//     params.push(limit, offset);

//     const [products]: any = await db.query(query, params);

//     // Récupérer le total pour calculer le nombre de pages côté Angular
//     const [total]: any = await db.query('SELECT COUNT(*) as count FROM products WHERE name LIKE ?', [`%${search}%`]);

//     res.json({
//       data: products,
//       total: total[0].count,
//       currentPage: page,
//       totalPages: Math.ceil(total[0].count / limit)
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// // backend/server.ts
// // const Flutterwave = require('flutterwave-node-v3');
// // const flw = new Flutterwave('FLWPUBK_TEST-fed09adc96c383957413b2aed6e5dcf9-X', 'FLWSECK_TEST-d39bd906a10da08e3b776187966a286a-X');
// //console.log(flw);

// const axios = require('axios');

// app.post('/api/pay', async (req, res) => {
//     try {
//        const amount = req.body.amount;
//         // On s'assure que l'email n'est jamais undefined
//         const email = (req.body.user && req.body.user.email) ? req.body.user.email : "client@gmail.com";
//         const tx_ref = `valala-${Date.now()}`;

//         // 2. LOG DE SÉCURITÉ (pour voir ce qui arrive dans votre console)
//         //console.log("Données reçues pour SQL:", { tx_ref, email, amount });

//         // 3. VÉRIFICATION : Si amount est undefined, on arrête tout de suite
//         if (!amount) {
//             return res.status(400).json({ error: "Le montant est requis et ne doit pas être undefined" });
//         }

//         // 1. ENREGISTREMENT INITIAL EN BASE DE DONNÉES
//         // On crée la commande avec le statut 'pending'
//        const [orderResult] : any= await db.execute(
//             `INSERT INTO orders (tx_ref, customer_email, total_amount, status,customer_name) VALUES (?, ?, ?, 'pending',?)`,
//             [tx_ref, email, amount,req.body.user.name]
//         );
//         const orderId :any = orderResult.insertId; // On récupère l'ID auto-incrémenté
//         console.log(req.body.items);
        
//         // 2. On boucle sur les articles du panier pour remplir order_items
//         // On lie chaque article à la commande grâce à orderId
//         for (let item of req.body.items) {
//             await db.execute(
//                 `INSERT INTO order_items (order_id, product_name, quantity, unit_price,product_id) VALUES (?, ?, ?, ?, ?)`,
//                 [orderId, item.name, item.quantity, item.price,item.id]
//             );
//         }
        
//         // 2. PRÉPARATION DU PAYLOAD POUR FLUTTERWAVE
//         const payload = {
//             tx_ref: tx_ref,
//             amount: amount,
//             currency: "EUR",
//             redirect_url: "http://localhost:4200/payment/success",
//             payment_options: "card, mobilemoney, account",
//             customer: { email: email },
//             customizations: {
//                 title: "Valala Pay",
//                 description: "Paiement sécurisé via GPay et Cartes",
//             }
//         };

//         // 3. APPEL À FLUTTERWAVE
//         const response = await axios.post(
//             'https://api.flutterwave.com/v3/payments', 
//             payload,
//             {
//                 headers: {
//                     Authorization: `Bearer FLWSECK_TEST-d39bd906a10da08e3b776187966a286a-X`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
       
//         // On renvoie la réponse (qui contient le lien) à Angular
//         res.json(response.data);
//         //console.log(response);
        

//     } catch (error:any) {
//         console.error("Erreur:", error.message);
//         res.status(500).json({ error: "Impossible d'initialiser le paiement" });
//     }
// });

// app.post('/flw-webhook', async (req, res) => {
//     const secretHash = "Point2vue$";
//     const signature = req.headers['verif-hash'];

//    const payload = req.body;
//    //console.log('repon  ',payload);
   
//     // Flutterwave envoie plusieurs types d'événements, on vérifie que c'est bien un succès
//     if (payload.status === 'successful') {
        
//         try {
//             console.log( [payload.id, payload]);
            
//             // 1. Mise à jour de la table 'orders'
//             const [result] :any = await db.execute(
//                 `UPDATE orders 
//                  SET status = 'paid', 
//                      transaction_id = ?, 
//                      updated_at = NOW() 
//                  WHERE tx_ref = ? AND status = 'pending'`,
//                 [payload.id, payload.txRef] // payload.id est l'ID Flutterwave
//             );
//             console.log(result);
            
// 11
//             if (result.affectedRows > 0) {
//                 console.log(`✅ Commande ${payload.tx_ref} mise à jour avec succès.`);
                
//                 // OPTIONNEL : Vous pouvez ici envoyer un email ou déclencher une action de livraison
//             } else {
//                 console.log(`⚠️ Commande ${payload.tx_ref} non trouvée ou déjà payée.`);
//             }

//         } catch (error) {
//             console.error("❌ Erreur SQL :", error);
//             // On renvoie 200 quand même pour éviter que Flutterwave ne renvoie le webhook sans cesse
//         }
//     }

//     // Toujours renvoyer 200 à Flutterwave
//     res.status(200).end();
// });

// app.post('/api/order/all',async (req: Request, res: Response) => {
//   try {
//     const page = parseInt(req.body.page as string) || 1;
//     const limit = parseInt(req.body.limit as string) || 10;
//     const search = req.body.search as string || '';
//     const status = req.body.status as string || '';
//     const offset = (page - 1) * limit;

//     let query = `
//       SELECT * 
//       FROM orders o 
//       WHERE o.customer_email LIKE ? 
//     `;
//     let queryCount = 'SELECT COUNT(*) as count FROM orders WHERE customer_email LIKE ?' 
//     let params: any[] = [`%${search}%` || '%%'];

//     // Ajouter le filtre catégorie si présent
//     if (status) {

//       query += ` AND o.status = ? `;
//       queryCount += ` AND status = ? `;
//       params.push(status);
//     }
//     const [total]: any = await db.query(queryCount, params);
//     // Ajouter la pagination
//     query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
//     params.push(limit, offset);

//     const [products]: any = await db.query(query, params);
//     // Récupérer le total pour calculer le nombre de pages côté Angular
    

//     res.json({
//       data: products,
//       total: total[0].count,
//       currentPage: page,
//       totalPages: Math.ceil(total[0].count / limit)
//     });
//   } catch (error) {
//     console.log(error);
    
//     res.status(500).json({ error: 'Erreur serveur' });
//   }
// });

// app.post('/api/paystack/initialize', async (req, res) => {
//   try {
//     const response = await axios.post(
//       'https://api.paystack.co/transaction/initialize',
//       {
//         email: req.body.email,
//         amount: req.body.amount * 100, // Paystack utilise les centimes
//         currency: "NGN",
//         callback_url: "http://localhost:4200/payment/success", // URL de retour
//       },
//       {
//         headers: {
//           Authorization: `Bearer sk_test_47d0e2870345060a1b24d000544bf6595a23b237`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
//     res.json(response.data);
//   } catch (error :any) {
//     console.log(error);
    
//     res.status(500).json({ error: error.message });
//   }
// });

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Serveur TS lancé sur http://localhost:${PORT}`));

// src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // On charge le .env AVANT tout le reste

import app from './app';
import { db } from './config/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Test de la connexion DB
    await db.getConnection();
    console.log('✅ Base de données connectée');

    // 2. Lancement du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1); // On arrête tout si la DB crash
  }
};

startServer();

