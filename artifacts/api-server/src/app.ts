import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"] ?? "newborn-tracker-secret-change-me";
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: process.env["DATABASE_URL"]
      ? new PgSession({
          conString: process.env["DATABASE_URL"],
          tableName: "session",
          createTableIfMissing: true,
        })
      : undefined,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env["NODE_ENV"] === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

// Serve the built React frontend when running as a standalone server (Render / Railway).
// On Vercel the CDN handles static files, so we skip this.
if (!process.env["VERCEL"]) {
  const _dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.join(_dirname, "..", "..", "newborn-tracker", "dist", "public");

  app.use(express.static(frontendDist));

  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) res.status(404).send("Not found");
    });
  });
}

export default app;
