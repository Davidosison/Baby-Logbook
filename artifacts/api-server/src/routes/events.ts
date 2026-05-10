import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { and, eq, gte, lte, desc, isNull } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function formatEvent(e: typeof eventsTable.$inferSelect) {
  return {
    id: e.id,
    type: e.type,
    startedAt: e.startedAt.toISOString(),
    endedAt: e.endedAt?.toISOString() ?? null,
    durationMinutes: e.durationMinutes,
    amountMl: e.amountMl,
    diaperType: e.diaperType,
    notes: e.notes,
    isActive: e.isActive,
  };
}

function getDateRange(dateStr?: string): { start: Date; end: Date } {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get("/events", requireAuth, async (req, res): Promise<void> => {
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
    )
    .orderBy(desc(eventsTable.startedAt));

  res.json(events.map(formatEvent));
});

router.post("/events/feeding", requireAuth, async (req, res): Promise<void> => {
  const { amountMl, durationMinutes, notes, startedAt } = req.body as {
    amountMl?: number;
    durationMinutes?: number;
    notes?: string;
    startedAt?: string;
  };

  const [event] = await db
    .insert(eventsTable)
    .values({
      type: "feeding",
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      amountMl: amountMl ?? null,
      durationMinutes: durationMinutes ?? null,
      notes: notes ?? null,
      isActive: false,
    })
    .returning();

  res.status(201).json(formatEvent(event!));
});

router.post("/events/sleep/start", requireAuth, async (req, res): Promise<void> => {
  // Stop any active sleep first
  const [activeSleep] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "sleep"), eq(eventsTable.isActive, true)))
    .limit(1);

  if (activeSleep) {
    const now = new Date();
    const durationMinutes = Math.round(
      (now.getTime() - activeSleep.startedAt.getTime()) / 60000,
    );
    await db
      .update(eventsTable)
      .set({ endedAt: now, durationMinutes, isActive: false })
      .where(eq(eventsTable.id, activeSleep.id));
  }

  const [event] = await db
    .insert(eventsTable)
    .values({
      type: "sleep",
      startedAt: new Date(),
      isActive: true,
    })
    .returning();

  res.status(201).json(formatEvent(event!));
});

router.post("/events/sleep/stop", requireAuth, async (req, res): Promise<void> => {
  const [activeSleep] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "sleep"), eq(eventsTable.isActive, true)))
    .orderBy(desc(eventsTable.startedAt))
    .limit(1);

  if (!activeSleep) {
    res.status(404).json({ error: "No active sleep session" });
    return;
  }

  const now = new Date();
  const durationMinutes = Math.round(
    (now.getTime() - activeSleep.startedAt.getTime()) / 60000,
  );

  const [event] = await db
    .update(eventsTable)
    .set({ endedAt: now, durationMinutes, isActive: false })
    .where(eq(eventsTable.id, activeSleep.id))
    .returning();

  res.json(formatEvent(event!));
});

router.post("/events/sleep", requireAuth, async (req, res): Promise<void> => {
  const { startedAt, endedAt, notes } = req.body as {
    startedAt: string;
    endedAt: string;
    notes?: string;
  };

  if (!startedAt || !endedAt) {
    res.status(400).json({ error: "startedAt and endedAt are required" });
    return;
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  const [event] = await db
    .insert(eventsTable)
    .values({
      type: "sleep",
      startedAt: start,
      endedAt: end,
      durationMinutes,
      notes: notes ?? null,
      isActive: false,
    })
    .returning();

  res.status(201).json(formatEvent(event!));
});

router.post("/events/diaper", requireAuth, async (req, res): Promise<void> => {
  const { diaperType, notes, startedAt } = req.body as {
    diaperType: "pee" | "poop" | "both";
    notes?: string;
    startedAt?: string;
  };

  if (!diaperType) {
    res.status(400).json({ error: "diaperType is required" });
    return;
  }

  const [event] = await db
    .insert(eventsTable)
    .values({
      type: "diaper",
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      diaperType,
      notes: notes ?? null,
      isActive: false,
    })
    .returning();

  res.status(201).json(formatEvent(event!));
});

router.get("/events/active-sleep", requireAuth, async (req, res): Promise<void> => {
  const [activeSleep] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.type, "sleep"), eq(eventsTable.isActive, true)))
    .orderBy(desc(eventsTable.startedAt))
    .limit(1);

  if (!activeSleep) {
    res.json({});
    return;
  }

  const elapsedMinutes = Math.round(
    (Date.now() - activeSleep.startedAt.getTime()) / 60000,
  );

  res.json({
    event: formatEvent(activeSleep),
    elapsedMinutes,
  });
});

router.delete("/events/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(raw ?? "", 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

export default router;
