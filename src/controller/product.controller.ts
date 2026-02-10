import path from "path";
import { db } from "../config/db";
import { Request, Response } from 'express';
import fs from 'fs';
import { deleteImage, uploadImage } from "../service/upload-service";
// --- 1. RÉCUPÉRER UN PRODUIT PAR ID (Ajusté pour les packs) ---
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. Récupération des infos de base du produit
    const query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?`;
    
    const [products]: any = await db.query(query, [id]);
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    const product = products[0];

    // 2. Récupération de toute la galerie d'images
    const [images]: any = await db.query(
      'SELECT id, image_url FROM product_images WHERE product_id = ?', 
      [id]
    );
    product.images = images;

    // 3. Récupération du contenu du pack (Articles fixes ou choix possibles)
    if (product.is_pack) {
     const [items]: any = await db.query(
      `SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.price, 
          p.stock,
          -- On récupère la première image de la galerie pour chaque produit du pack
          COALESCE(
            (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1),
            p.image_url
          ) AS image_url
      FROM pack_items pi 
      JOIN products p ON pi.product_id = p.id 
      WHERE pi.pack_id = ?`, 
      [id]
    );
  product.pack_contents = items;
      
      // Calcul du label de réduction si applicable
      if (product.original_price && product.price < product.original_price) {
        const savings = ((product.original_price - product.price) / product.original_price) * 100;
        product.discount_label = `-${Math.round(savings)}%`;
      }
    } else {
      product.pack_contents = [];
    }

    res.json({ data: product });
  } catch (error) {
    console.error("Erreur getProductById:", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// --- 2. AJOUTER UN PRODUIT/PACK (Ajusté avec original_price) ---
export const addProduct = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { 
      name, description, price, stock, category_id, 
      images = [], // Tableau de base64
      is_pack = false,
      is_flexible = false, // Nouveau
      flex_slots = 0,      // Nouveau (ex: 5)
      productIds = [],     // Si flexible, ce sont les produits "éligibles"
      original_price = null 
    } = req.body;

    // 1. Insertion du produit principal
    const [result]: any = await connection.query(
      `INSERT INTO products 
       (name, description, price, original_price, stock, category_id, is_pack, is_flexible, flex_slots) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, original_price, stock, category_id, is_pack, is_flexible, flex_slots]
    );

    const mainProductId = result.insertId;

    // 2. Gestion des Multi-Photos
    if (images.length > 0) {
      for (const base64 of images) {
        if (base64.includes('base64')) {
          const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches) {
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `prod_${mainProductId}_${Date.now()}.${matches[1].split('/')[1]}`;
            const imageUrl = await uploadImage(buffer, fileName);
            
            await connection.query(
              'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
              [mainProductId, imageUrl]
            );
          }
        }
      }
    }

    // 3. Liaison des produits (Contenu fixe OU Sélection éligible)
    if (is_pack && productIds.length > 0) {
      const packValues = productIds.map((id: number) => [mainProductId, id]);
      await connection.query('INSERT INTO pack_items (pack_id, product_id) VALUES ?', [packValues]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Pack créé avec succès !', id: mainProductId });
  } catch (error: any) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const ActivateOrDesactivateProduct = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;
    // 1. Récupération des infos de base du produit
    const query = `
      SELECT p.is_active from products p WHERE p.id = ?`;
    
    const [products]: any = await db.query(query, [id]);
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }
 
    // 1. Mise à jour des infos principales
    await connection.query(
      `UPDATE products SET 
        is_active = ? WHERE id = ?`,
      [!products[0].is_active, id]
    );
    await connection.commit();
    res.json({ message: 'Produit mis à jour avec succès !' });
  }catch(error){
    console.log(error);
    
     await connection.rollback();
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
}

// --- 3. METTRE À JOUR UN PRODUIT/PACK (Ajusté avec original_price) ---
export const updateProduct = async (req: Request, res: Response) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;
    const { 
      name, description, price, original_price, stock, 
      category_id, images, is_pack, is_flexible, flex_slots, productIds 
    } = req.body;

    // 1. Mise à jour des infos principales
    await connection.query(
      `UPDATE products SET 
        name = ?, description = ?, price = ?, original_price = ?, 
        stock = ?, category_id = ?, is_pack = ?, is_flexible = ?, flex_slots = ? 
       WHERE id = ?`,
      [name, description, price, original_price, stock, category_id, is_pack, is_flexible, flex_slots, id]
    );

    // 2. Ajout de nouvelles images si présentes
    if (images && Array.isArray(images)) {
      for (const base64 of images) {
        if (base64.includes('base64')) {
          const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches) {
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `prod_${id}_${Date.now()}.${matches[1].split('/')[1]}`;
            const imageUrl = await uploadImage(buffer, fileName);
            await connection.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, imageUrl]);
          }
        }
      }
    }

    // 3. Mise à jour des composants du pack
    await connection.query('DELETE FROM pack_items WHERE pack_id = ?', [id]);
    if (is_pack && Array.isArray(productIds) && productIds.length > 0) {
      const packValues = productIds.map((childId: number) => [id, childId]);
      await connection.query('INSERT INTO pack_items (pack_id, product_id) VALUES ?', [packValues]);
    }

    await connection.commit();
    res.json({ message: 'Produit mis à jour avec succès !' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  } finally {
    connection.release();
  }
};
export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 10;
    const search = req.body.search as string || '';
    const category = req.body.category as string || '';
    const offset = (page - 1) * limit;

    let params: any[] = [`%${search}%`];
    let filterQuery = " WHERE p.name LIKE ? ";

    if (category) {
      filterQuery += ` AND c.name = ? `;
      params.push(category);
    }

    // Requête : on récupère aussi is_flexible, flex_slots et la 1ère image
    const query = `
      SELECT p.*, c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as main_image
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${filterQuery}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;

    const [products]: any = await db.query(query, [...params, limit, offset]);

    const productsWithEnrichment = await Promise.all(products.map(async (product: any) => {
      let pack_contents = [];
      let discount_label = null;

      // Si c'est un pack (fixe ou flexible), on récupère les items liés
      if (product.is_pack) {
        const [items]: any = await db.query(
          `SELECT p.id, p.name, p.price, p.stock ,c.name as category_name
           FROM pack_items pi 
           JOIN products p ON pi.product_id = p.id  LEFT JOIN categories c ON p.category_id = c.id
           WHERE pi.pack_id = ?`, 
          [product.id]
        );
        console.log(items);
        
        pack_contents = items;

        if (product.original_price && product.price < product.original_price) {
          const savings = ((product.original_price - product.price) / product.original_price) * 100;
          discount_label = `-${Math.round(savings)}%`;
        }
      }

      return { 
        ...product, 
        pack_contents, 
        discount_label 
      };
    }));

    const countQuery = `SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id ${filterQuery}`;
    const [total]: any = await db.query(countQuery, params);

    res.json({
      data: productsWithEnrichment,
      total: total[0].count,
      currentPage: page,
      totalPages: Math.ceil(total[0].count / limit)
    });

  } catch (error) {
    console.error("Erreur getAllProduct:", error);
    res.status(500).json({ error: 'Erreur serveur' });
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