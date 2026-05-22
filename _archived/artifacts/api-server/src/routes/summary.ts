import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { and, eq, gte, lte, lt, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function getDateRange(dateStr?: string): { start: Date; end: Date } {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get("/summary", requireAuth, async (req, res): Promise<void> => {
  const dateStr = typeof req.query["date"] === "string" ? req.query["date"] : undefined;
  const { start, end } = getDateRange(dateStr);

  const events = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        gte(eventsTable.startedAt, start),
        lte(eventsTable.startedAt, end),
      ),
    );

  const feedings = events.filter((e) => e.type === "feeding");
  const sleeps = events.filter((e) => e.type === "sleep");
  const diapers = events.filter((e) => e.type === "diaper");

  const totalFeedingMl = feedings.reduce((sum, e) => sum + (e.amountMl ?? 0), 0);
  const totalFeedingMinutes = feedings.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const totalSleepMinutes = sleeps.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const peeCount = diapers.filter((e) => e.diaperType === "pee" || e.diaperType === "both").length;
  const poopCount = diapers.filter((e) => e.diaperType === "poop" || e.diaperType === "both").length;

  res.json({
    date: dateStr ?? new Date().toISOString().split("T")[0],
    feedingCount: feedings.length,
    totalFeedingMl,
    totalFeedingMinutes,
    sleepCount: sleeps.length,
    totalSleepMinutes,
    diaperCount: diapers.length,
    peeCount,
    poopCount,
    feedingGoalMin: 8,
    feedingGoalMax: 12,
    sleepGoalMinutes: 960,
  });
});

router.get("/summary/recent", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();

  const [lastFeeding] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "feeding"), eq(eventsTable.isActive, false)))
    .orderBy(desc(eventsTable.startedAt))
    .limit(1);

  const [lastSleep] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "sleep"), eq(eventsTable.isActive, false)))
    .orderBy(desc(eventsTable.startedAt))
    .limit(1);

  const [lastDiaper] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "diaper"), eq(eventsTable.isActive, false)))
    .orderBy(desc(eventsTable.startedAt))
    .limit(1);

  const minutesAgo = (d?: Date | null) =>
    d ? Math.floor((now.getTime() - d.getTime()) / 60000) : null;

  res.json({
    lastFeedingAt: lastFeeding?.startedAt?.toISOString() ?? null,
    lastSleepAt: lastSleep?.startedAt?.toISOString() ?? null,
    lastDiaperAt: lastDiaper?.startedAt?.toISOString() ?? null,
    lastFeedingMinutesAgo: minutesAgo(lastFeeding?.startedAt),
    lastSleepMinutesAgo: minutesAgo(lastSleep?.startedAt),
    lastDiaperMinutesAgo: minutesAgo(lastDiaper?.startedAt),
  });
});

export default router;
