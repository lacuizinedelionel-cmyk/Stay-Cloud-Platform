import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import superadminRouter from "./superadmin";
import businessesRouter from "./businesses";
import branchesRouter from "./branches";
import clientsRouter from "./clients";
import paymentsRouter from "./payments";
import notificationsRouter from "./notifications";
import restaurantRouter from "./restaurant";
import hotelRouter from "./hotel";
import beautyRouter from "./beauty";
import groceryRouter from "./grocery";
import pharmacyRouter from "./pharmacy";
import garageRouter from "./garage";
import fitnessRouter from "./fitness";
import educationRouter from "./education";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(superadminRouter);
router.use(businessesRouter);
router.use(branchesRouter);
router.use(clientsRouter);
router.use(paymentsRouter);
router.use(notificationsRouter);
router.use(restaurantRouter);
router.use(hotelRouter);
router.use(beautyRouter);
router.use(groceryRouter);
router.use(pharmacyRouter);
router.use(garageRouter);
router.use(fitnessRouter);
router.use(educationRouter);

export default router;
