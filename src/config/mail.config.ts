import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rakotonindrinasandiarivelo@gmail.com',
    pass: 'ggik mecb eoka tdmm' // Pas votre mot de passe habituel !
  }
});