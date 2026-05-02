import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory state for the waiting room
  const state = {
    isActive: false,
    rooms: Array.from({ length: 7 }).map((_, i) => ({
      id: i + 1,
      name: `SECTOR_0${i + 1}`,
      guests: 0,
      max: 100
    }))
  };

  // API Routes
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, code } = req.body;
    if (username === "ayoub" && code === "rachid") {
      res.json({ success: true, token: "ELITE_HACKER_TOKEN_999" });
    } else {
      res.status(401).json({ success: false, message: "ACCESS DENIED" });
    }
  });

  app.post("/api/admin/toggle", (req, res) => {
    const { token } = req.body;
    if (token !== "ELITE_HACKER_TOKEN_999") {
      return res.status(401).json({ success: false, message: "UNAUTHORIZED" });
    }
    state.isActive = !state.isActive;
    res.json({ success: true, isActive: state.isActive });
  });

  app.post("/api/register", (req, res) => {
    const { roomId } = req.body;
    const room = state.rooms.find(r => r.id === roomId);
    
    if (room && room.guests < room.max) {
      room.guests += 1;
      res.json({ success: true, room });
    } else {
      res.status(400).json({ success: false, message: "ROOM FULL OR INVALID" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
