import { Router } from "express";
import { addActivity, getActivityById, getAllActivity, updateActivity } from "../controller/activity.controller";
import { getProductById } from "../controller/product.controller";

const activityRoute = Router();
activityRoute.post('/add', addActivity);
activityRoute.post('/update/:id', updateActivity);
activityRoute.get('/all', getAllActivity);
activityRoute.get('/:id', getActivityById);
export default activityRoute ;