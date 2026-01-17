import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

// Configuration Cloudinary (les clés sont dans votre .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload flexible : Cloudinary ou Local
 */
export const uploadImage = async (buffer: Buffer, fileName: string): Promise<string> => {
    const strategy = process.env.UPLOAD_STRATEGY || 'local';

    if (strategy === 'cloudinary') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { 
                    folder: 'activites', 
                    public_id: fileName.split('.')[0] 
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!.secure_url); // URL HTTPS permanente
                }
            );
            uploadStream.end(buffer);
        });
    } else {
        // Mode Local (Dossier racine /uploads)
        const uploadDir = path.join(process.cwd(), 'uploads', 'activites');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        
        const fullPath = path.join(uploadDir, fileName);
        fs.writeFileSync(fullPath, buffer);
        
        return `uploads/activites/${fileName}`;
    }
};

/**
 * Suppression flexible : Cloudinary ou Local
 */
export const deleteImage = async (urlOrPath: string) => {
    const strategy = process.env.UPLOAD_STRATEGY || 'local';

    try {
        if (strategy === 'cloudinary' && urlOrPath.startsWith('http')) {
            // Extraction du public_id pour Cloudinary
            const parts = urlOrPath.split('/');
            const fileName = parts[parts.length - 1].split('.')[0];
            await cloudinary.uploader.destroy(`activites/${fileName}`);
        } else {
            // Suppression locale
            const fullPath = path.join(process.cwd(), urlOrPath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
    } catch (e) {
        console.warn("L'image n'a pas pu être supprimée physiquement:", e);
    }
};