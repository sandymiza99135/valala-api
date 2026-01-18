import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../config/db';
import { v2 as cloudinary } from 'cloudinary';
import { deleteImage, uploadImage } from '../service/upload-service';
// Configuration Cloudinary

export const addActivity = async (req: Request, res: Response) => {
    const { titre, description, date_activite, lieu, user_id, images, statut } = req.body;

    try {
        const [result]: any = await db.query(
            "INSERT INTO activites (titre, description, date_activite, lieu, user_id, statut) VALUES (?, ?, ?, ?, ?, ?)",
            [titre, description, date_activite, lieu, user_id, statut]
        );
        const activiteId = result.insertId;

        if (images && images.length > 0) {
            for (let [index, base64Str] of images.entries()) {
                const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    const fileName = `act_${activiteId}_${index}_${Date.now()}.jpg`;

                    const finalPath = await uploadImage(buffer, fileName);
                    await db.query("INSERT INTO activite_images (activite_id, url_image) VALUES (?, ?)", [activiteId, finalPath]);
                }
            }
        }
        res.json({ success: true, message: "Activité créée !" });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { titre, description, date_activite, lieu, images, statut } = req.body;

    try {
        await db.query(
            "UPDATE activites SET titre = ?, description = ?, date_activite = ?, lieu = ?, statut = ? WHERE id = ?",
            [titre, description, date_activite, lieu, statut, id]
        );

        if (images && images.length > 0) {
            // 1. Nettoyage des anciennes images
            const [oldImages]: any = await db.query("SELECT url_image FROM activite_images WHERE activite_id = ?", [id]);
            for (let img of oldImages) {
                await deleteImage(img.url_image);
            }
            await db.query("DELETE FROM activite_images WHERE activite_id = ?", [id]);

            // 2. Upload des nouvelles
            for (let [index, base64Str] of images.entries()) {
                const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches) {
                    const buffer = Buffer.from(matches[2], 'base64');
                    const fileName = `act_${id}_${index}_${Date.now()}.jpg`;
                    const finalPath = await uploadImage(buffer, fileName);
                    await db.query("INSERT INTO activite_images (activite_id, url_image) VALUES (?, ?)", [id, finalPath]);
                }
            }
        }
        res.json({ success: true, message: "Mise à jour réussie !" });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

export const getAllActivity = async (req: Request, res: Response) => {
    try {
        // 1. Récupération des paramètres avec valeurs par défaut
        const status = req.query.status as string;
        const search = req.query.search as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        // 2. Construction dynamique des filtres
        if (status) {
            whereClauses.push("a.statut = ?");
            queryParams.push(status);
        }

        if (search) {
            // Recherche dans le titre ou la description
            whereClauses.push("(a.titre LIKE ? OR a.description LIKE ?)");
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 3. Requête principale avec Pagination
        const query = `
            SELECT 
                a.*, 
                u.name as organisateur_nom,
                GROUP_CONCAT(ai.url_image) as images_list
            FROM activites a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN activite_images ai ON a.id = ai.activite_id
            ${whereSql}
            GROUP BY a.id
            ORDER BY a.date_activite DESC
            LIMIT ? OFFSET ?
        `;

        // Ajout des paramètres de pagination à la fin du tableau
        const [rows]: any = await db.query(query, [...queryParams, limit, offset]);

        // 4. Requête pour le total (nécessaire pour la pagination côté frontend)
        const countQuery = `SELECT COUNT(*) as total FROM activites a ${whereSql}`;
        const [countResult]: any = await db.query(countQuery, queryParams);
        const totalItems = countResult[0].total;

        // 5. Formatage des données
        const formattedData = rows.map((row: any) => ({
            ...row,
            images: row.images_list ? row.images_list.split(',') : []
        }));

        // 6. Réponse enrichie
        res.json({
            data: formattedData,
            meta: {
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error("Erreur Get All:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des activités" });
    }
}

export const getActivityById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Requête SQL détaillée pour une seule activité
        const query = `
            SELECT 
                a.*, 
                u.name as organisateur_nom,
                u.email as organisateur_email,
                GROUP_CONCAT(ai.url_image) as images_list
            FROM activites a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN activite_images ai ON a.id = ai.activite_id
            WHERE a.id = ?
            GROUP BY a.id
        `;

        const [rows]: any = await db.query(query, [id]);

        // 2. Vérification si l'activité existe
        if (rows.length === 0) {
            return res.status(404).json({ 
                message: "Activité non trouvée" 
            });
        }

        const activity = rows[0];

        // 3. Formatage de la liste des images (string vers tableau)
        const formattedActivity = {
            ...activity,
            images: activity.images_list ? activity.images_list.split(',') : []
        };

        // Supprimer la chaîne brute pour plus de propreté
        delete formattedActivity.images_list;

        // 4. Réponse
        res.json(formattedActivity);

    } catch (error) {
        console.error("Erreur Get Activity By Id:", error);
        res.status(500).json({ 
            error: "Erreur lors de la récupération des détails de l'activité" 
        });
    }
};

