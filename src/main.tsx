import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Self-hosted font — no network round-trip, no render-blocking
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";

createRoot(document.getElementById("root")!).render(<App />);
