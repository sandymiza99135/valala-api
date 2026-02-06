import { db } from "../config/db";

export class DonService {
    
    static async saveMaterialDonation(data: any) {
        try {
            console.log(data);
            
            const [result]: any = await db.execute(
                `INSERT INTO material_donations 
                (donor_name, email, item_description, appointment_type, scheduled_at, address, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    data.name || 'Anonyme', 
                    data.email, 
                    data.items, 
                    data.appointmentType, 
                    data.scheduledAt, 
                    data.address || null
                ]
            );

            return {
                success: true,
                donationId: result.insertId,
                message: "Votre promesse de don matériel a été enregistrée. Nous vous contacterons pour la suite."
            };
        } catch (error: any) {
            throw new Error(`Erreur insertion matériel: ${error.message}`);
        }
    }
    static async getAllMaterialDonations(filters: any) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM material_donations WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM material_donations WHERE 1=1`;
    
    const filterParams: any[] = [];

    // On vérifie que status n'est ni null, ni undefined, ni une chaîne vide
    if (filters.status && filters.status.trim() !== "") {
        query += ` AND status = ?`;
        countQuery += ` AND status = ?`;
        filterParams.push(filters.status);
    }

    if (filters.search && filters.search.trim() !== "") {
        const searchParam = `%${filters.search}%`;
        query += ` AND (donor_name LIKE ? OR email LIKE ?)`;
        countQuery += ` AND (donor_name LIKE ? OR email LIKE ?)`;
        filterParams.push(searchParam, searchParam);
    }

    // Pagination (LIMIT et OFFSET ne doivent être ajoutés QU'À la query de data)
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    
    // IMPORTANT : On prépare les deux tableaux séparément pour ne jamais mélanger
    const dataParams = [...filterParams, limit, offset];

    try {
        // Exécution de la requête de comptage avec SEULEMENT les filtres
        const [totalRows]: any = await db.execute(countQuery, filterParams);
        
        // Exécution de la requête de données avec filtres + pagination
        const [rows]: any = await db.execute(query, dataParams);

        return {
            data: rows,
            pagination: {
                total: totalRows[0].total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalRows[0].total / limit)
            }
        };
    } catch (error: any) {
        // Ce log vous dira exactement quel tableau a échoué
        console.error("Détails de l'erreur SQL:", error.message);
        console.error("Query tentative:", query);
        console.error("Params envoyés:", dataParams);
        throw error;
    }
}
    static async updateMaterialStatus(id: number, status: string) {
        await db.execute(
            `UPDATE material_donations SET status = ? WHERE id = ?`,
            [status, id]
        );
        // On récupère le don pour avoir les infos du donneur pour le mail
        const [rows]: any = await db.execute(`SELECT * FROM material_donations WHERE id = ?`, [id]);
        return rows[0];
    }
}