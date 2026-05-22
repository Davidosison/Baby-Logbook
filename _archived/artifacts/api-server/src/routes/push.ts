import { Router, type IRouter } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable, eventsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VAPID_PUBLIC_KEY = process.env["VAPID_PUBLIC_KEY"] ?? "";
const VAPID_PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"] ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:tracker@family.local",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/push/vapid-public-key", async (_req, res): Promise<void> => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint, keys } = req.body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }

  try {
    await db
      .insert(pushSubscriptionsTable)
      .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { p256dh: keys.p256dh, auth: keys.auth },
      });

    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save push subscription");
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.delete("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint } = req.body as { endpoint?: string };
  if (!endpoint) {
    res.status(400).json({ error: "endpoint required" });
    return;
  }
  await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ success: true });
});

// Internal helper — send a push to all subscribers
export async function sendPushToAll(payload: { title: string; body: string; tag?: string }) {
  const subs = await db.select().from(pushSubscriptionsTable);
  const payloadStr = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr,
      ),
    ),
  );

  // Remove expired/invalid subscriptions
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r?.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        const sub = subs[i];
        if (sub) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
        }
      }
    }
  }
}

// Background checker: every 5 minutes, check if feeding is overdue (3 hours)
const FEEDING_ALERT_MINUTES = 180;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

let lastAlertSent = 0;

async function checkFeedingOverdue() {
  try {
    const [lastFeeding] = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.type, "feeding"), eq(eventsTable.isActive, false)))
      .orderBy(desc(eventsTable.startedAt))
      .limit(1);

    const now = Date.now();
    const minutesSince = lastFeeding
      ? Math.floor((now - new Date(lastFeeding.startedAt).getTime()) / 60000)
      : null;

    // If never fed, or overdue, and we haven't sent an alert in the last hour
    const isOverdue = minutesSince === null || minutesSince >= FEEDING_ALERT_MINUTES;
    const cooldownPassed = now - lastAlertSent > 60 * 60 * 1000;

    if (isOverdue && cooldownPassed) {
      const msg =
        minutesSince === null
          ? "לא תועדה האכלה עדיין"
          : `עברו ${Math.floor(minutesSince / 60)} שעות ו-${minutesSince % 60} דקות מהאכלה אחרונה`;

      await sendPushToAll({
        title: "תזכורת האכלה",
        body: msg,
        tag: "feeding-reminder",
      });
      lastAlertSent = now;
      logger.info({ minutesSince }, "Sent feeding overdue push notification");
    }
  } catch (err) {
    logger.error({ err }, "Error in feeding overdue check");
  }
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  setInterval(checkFeedingOverdue, CHECK_INTERVAL_MS);
  logger.info("Push notification background checker started");
}

export default router;
