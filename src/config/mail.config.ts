import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER_NAME,
    pass: process.env.MAIL_PASS // Pas votre mot de passe habituel !
  }
});