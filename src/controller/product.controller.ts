import path from "path";
import { db } from "../config/db";
import { Request, Response } from 'express';
import fs from 'fs';
import { deleteImage, uploadImage } from "../service/upload-service";
export const getProductById = async (req: Request, res: Response) => {

     try{
         let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ? 
    `;
       let params =[req.params.id]
        const [products]: any = await db.query(query,params);
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Produit introuvable" });
            }
        res.json({
      data: products[0]
    });
    }catch (error) {
        console.log(error);
        
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
export const getAllProduct = async (req: Request, res: Response) => {

    try {
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 10;
    const search = req.body.search as string || '';
    const category = req.body.category as string || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.name LIKE ? 
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.name LIKE ?'
    let params: any[] = [`%${search}%` || '%%'];

    // Ajouter le filtre catégorie si présent
    if (category) {

      query += ` AND c.name = ? `;
      countQuery += ` AND c.name = ? `;
      params.push(category);
    }

    // Ajouter la pagination
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [products]: any = await db.query(query, params);

    // Récupérer le total pour calculer le nombre de pages côté Angular
    const [total]: any = await db.query(countQuery, params);

    res.json({
      data: products,
      total: total[0].count,
      currentPage: page,
      totalPages: Math.ceil(total[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category_id, imageBase64 } = req.body;

    let imageUrl = null;

    if (imageBase64 && imageBase64.includes('base64')) {
      // 1. Extraction des données
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Format d\'image invalide' });
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const fileName = `prod_${Date.now()}.${mimeType.split('/')[1]}`;

      // 2. Utilisation de la fonction utilitaire flexiblel
      imageUrl = await uploadImage(buffer, fileName);
    }

    // 3. Enregistrement dans MySQL
    await db.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, category_id, imageUrl]
    );

    res.status(201).json({ message: 'Produit créé avec succès !', imageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
};
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, imageBase64 } = req.body;

    // 1. Récupérer l'ancienne image pour le nettoyage
    const [rows]: any = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });

    let imageUrl = rows[0].image_url;

    // 2. Si une nouvelle image est fournie
    if (imageBase64 && imageBase64.includes('base64')) {
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const fileName = `prod_${id}_${Date.now()}.${mimeType.split('/')[1]}`;

        // --- ÉTAPE A : Supprimer l'ancienne image via la fonction flexible ---
        if (imageUrl) {
          await deleteImage(imageUrl);
        }

        // --- ÉTAPE B : Uploader la nouvelle image ---
        imageUrl = await uploadImage(buffer, fileName);
      }
    }

    // 3. Mise à jour SQL
    const query = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ?
      WHERE id = ?`;
    await db.query(query, [name, description, price, stock, category_id, imageUrl, id]);

    res.json({ message: 'Produit mis à jour !', imageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};
export const getAllCategoryProduct = async (req: Request, res: Response) => {

    try{
         let query = `
            SELECT *
            FROM categories`;
        const [categories]: any = await db.query(query);
        res.json({
      data: categories
    });
    }catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}