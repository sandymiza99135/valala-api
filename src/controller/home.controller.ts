import { Request, Response } from 'express';
export const getAllActivity = async (req: Request, res: Response) => {
 try {
        

        res.send(process.env.PAYPAL_API);

    } catch (error) {
        console.error("Erreur Get All:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des activités" });
    }
}