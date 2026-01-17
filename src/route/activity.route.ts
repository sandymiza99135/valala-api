import { Router } from "express";
import { addActivity, getAllActivity, updateActivity } from "../controller/activity.controller";

const activityRoute = Router();
activityRoute.post('/add', addActivity);
activityRoute.post('/update/:id', updateActivity);
activityRoute.get('/all', getAllActivity);
export default activityRoute ;