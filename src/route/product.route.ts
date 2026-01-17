import { Router } from "express";
import { addProduct, getAllCategoryProduct, getAllProduct, getProductById, updateProduct } from "../controller/product.controller";
const productRoute = Router();
productRoute.get('/category/all', getAllCategoryProduct);
productRoute.get('/:id', getProductById);
productRoute.post('/add', addProduct);
productRoute.post('/all', getAllProduct);
productRoute.post('/update/:id', updateProduct);
export default productRoute;
