// Vercel Serverless Function entry point.
// Vercel imports this file, calls the default export with (req, res).
// Express handles all routing internally — no app.listen() needed here.
export { default } from "../artifacts/api-server/src/app";
