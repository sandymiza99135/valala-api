import { Router } from "express";
import { createCOntact } from "../controller/contact-controller";
import { body } from "express-validator";

const contactValidation = [
  body('name').trim().notEmpty().isLength({ min: 2 }).withMessage('Le nom est requis (min 2 caractères)'),
  body('phone').trim().notEmpty().matches(/^[+]?[\d\s-]+$/).withMessage('Téléphone invalide'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Email invalide'),
  body('subject').trim().notEmpty().isLength({ min: 3 }).withMessage('Le sujet est requis'),
  body('message').trim().notEmpty().isLength({ min: 10 }).withMessage('Message trop court (min 10 caractères)')
];
const contactRoute = Router();
contactRoute.post('/add',contactValidation ,createCOntact);
export default contactRoute ;