import { Router, type IRouter } from "express";

const router: IRouter = Router();

const FAMILY_PIN = process.env["FAMILY_PIN"] ?? "1234";

router.post("/auth/verify", async (req, res): Promise<void> => {
  const { pin } = req.body as { pin?: string };
  if (!pin || pin !== FAMILY_PIN) {
    res.status(401).json({ success: false, message: "Invalid PIN" });
    return;
  }
  req.session.authenticated = true;
  res.json({ success: true, message: "Authenticated" });
});

router.get("/auth/status", async (req, res): Promise<void> => {
  res.json({
    authenticated: !!req.session.authenticated,
    babyName: "Our Baby",
    babyBirthDate: "2026-05-05",
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
