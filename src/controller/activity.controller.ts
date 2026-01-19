import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../config/db';
import { v2 as cloudinary } from 'cloudinary';
import { deleteImage, uploadImage } from '../service/upload-service';
// Configuration Cloudinary

export const addActivity = async (req: Request, res: Response) => {
    // Note: 'images' peut maintenant contenir des images ou des vidéos (Base64)
    const { titre, description, date_activite, lieu, user_id, images, statut } = req.body;

    try {
        // 1. Insertion de l'activité
        const [result]: any = await db.query(
            "INSERT INTO activites (titre, description, date_activite, lieu, user_id, statut) VALUES (?, ?, ?, ?, ?, ?)",
            [titre, description, date_activite, lieu, user_id, statut]
        );
        const activiteId = result.insertId;

        // 2. Traitement des médias (Images et Vidéos)
        if (images && images.length > 0) {
            for (let [index, base64Str] of images.entries()) {
                // Regex ajustée pour capturer n'importe quel type de média (image/jpeg, video/mp4, etc.)
                const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches) {
                    const mimeType = matches[1]; // ex: "video/mp4" ou "image/jpeg"
                    const buffer = Buffer.from(matches[2], 'base64');

                    // Déterminer l'extension en fonction du type MIME
                    const extension = mimeType.split('/')[1];
                    const isVideo = mimeType.startsWith('video');

                    const fileName = `${isVideo ? 'vid' : 'act'}_${activiteId}_${index}_${Date.now()}.${extension}`;

                    // On utilise votre fonction uploadImage (elle devrait idéalement être renommée uploadToCloudinary ou uploadFile)
                    const finalPath = await uploadImage(buffer, fileName);

                    // 3. Insertion dans la table des médias
                    // Conseil : Assurez-vous que votre table 'activite_images' peut stocker des URLs de vidéos
                    await db.query(
                        "INSERT INTO activite_images (activite_id, url_image) VALUES (?, ?)",
                        [activiteId, finalPath]
                    );
                }
            }
        }
        res.json({ success: true, message: "Activité et médias enregistrés !" });
    } catch (error) {
        console.error("Erreur Upload:", error);
        res.status(500).json({ error: "Erreur lors de la création de l'activité" });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { titre, description, date_activite, lieu, images, statut } = req.body;

    try {
        // 1. Mise à jour des infos textuelles
        await db.query(
            "UPDATE activites SET titre = ?, description = ?, date_activite = ?, lieu = ?, statut = ? WHERE id = ?",
            [titre, description, date_activite, lieu, statut, id]
        );

        if (images && Array.isArray(images)) {
            // 2. Identifier les images à supprimer 
            // On récupère ce qui est en base actuellement
            const [currentRows]: any = await db.query("SELECT url_image FROM activite_images WHERE activite_id = ?", [id]);
            const currentUrls = currentRows.map((r: any) => r.url_image);

            // Celles qui ne sont plus dans le tableau 'images' envoyé par le front doivent être supprimées
            const urlsToKeep = images.filter(img => !img.startsWith('data:'));
            const urlsToDelete = currentUrls.filter((url: string) => !urlsToKeep.includes(url));

            for (let url of urlsToDelete) {
                await deleteImage(url); // Votre fonction qui supprime physiquement le fichier
                await db.query("DELETE FROM activite_images WHERE url_image = ?", [url]);
            }

            // 3. Traiter uniquement les NOUVEAUX médias (ceux en Base64)
            const newMedia = images.filter(img => img.startsWith('data:'));

            for (let [index, base64Str] of newMedia.entries()) {
                try {
                    // 1. Vérification de sécurité de base
                    if (!base64Str.includes(';base64,')) {
                        console.error("L'élément n'est pas un Data URI valide:", base64Str.substring(0, 30));
                        continue;
                    }

                    // 2. Découpage manuel de la chaîne
                    // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                    const parts = base64Str.split(';base64,');
                    const header = parts[0]; // "data:image/jpeg"
                    const base64Data = parts[1]; // "/9j/4AAQSkZJRg..."

                    // 3. Extraction du type MIME
                    const mimeType = header.split(':')[1]; // "image/jpeg"

                    // 4. Création du Buffer
                    const buffer = Buffer.from(base64Data, 'base64');

                    // 5. Détermination de l'extension et du type
                    const extension = mimeType.split('/')[1] || 'jpg';
                    const isVideo = mimeType.startsWith('video');

                    console.log(`Traitement de : ${mimeType} (${buffer.length} octets)`);

                    // 6. Upload
                    const fileName = `${isVideo ? 'vid' : 'act'}_${id}_upd_${Date.now()}_${index}.${extension}`;
                    const finalPath = await uploadImage(buffer, fileName);

                    await db.query(
                        "INSERT INTO activite_images (activite_id, url_image) VALUES (?, ?)",
                        [id, finalPath]
                    );

                } catch (err) {
                    console.error("Erreur lors du traitement du média index " + index, err);
                }
            }
        }

        res.json({ success: true, message: "Activité mise à jour avec succès !" });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
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

