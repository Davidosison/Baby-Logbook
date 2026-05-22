import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import eventsRouter from "./events";
import summaryRouter from "./summary";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(eventsRouter);
router.use(summaryRouter);
router.use(pushRouter);

export default router;
