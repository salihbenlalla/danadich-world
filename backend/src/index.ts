import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { networkInterfaces } from "os";

type Role = "dandouch" | "dandoucha";
type Stage = "ritual" | "dreamIntro" | "mainExperience";

interface ClientMessage {
  type: "JOIN" | "HEART_START" | "HEART_STOP" | "NEW_WHISPER" | "STAGE_SYNC";
  role?: Role;
  text?: string;
  stage?: Stage;
}

interface ServerMessage {
  type:
    | "HEART_START"
    | "HEART_STOP"
    | "NEW_WHISPER"
    | "STAGE_SYNC"
    | "TOGETHER"
    | "PARTNER_CONNECTED"
    | "PARTNER_DISCONNECTED";
  role?: Role;
  text?: string;
  from?: Role;
  stage?: Stage;
  active?: boolean;
}

interface RoomState {
  dandouchConnected: boolean;
  dandouchaConnected: boolean;
  dandouchaStage: Stage;
  heartHeld: { dandouch: boolean; dandoucha: boolean };
}

const room: RoomState = {
  dandouchConnected: false,
  dandouchaConnected: false,
  dandouchaStage: "ritual",
  heartHeld: { dandouch: false, dandoucha: false },
};

// Map raw ws instances to their roles (Elysia creates new ElysiaWS per message, raw is stable)
const clients = new Map<unknown, Role>();

function getStableKey(ws: unknown): unknown {
  return (ws as { raw?: unknown }).raw ?? ws;
}

function broadcast(msg: ServerMessage, exclude?: unknown) {
  const payload = JSON.stringify(msg);
  for (const [ws] of clients) {
    if (ws !== exclude) {
      try {
        (ws as { send: (data: string) => void }).send(payload);
      } catch {
        // client disconnected
      }
    }
  }
}

function sendTo(ws: unknown, msg: ServerMessage) {
  try {
    (ws as { send: (data: string) => void }).send(JSON.stringify(msg));
  } catch {
    // client disconnected
  }
}

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const PORT = Number(process.env.PORT) || 3001;

const app = new Elysia()
  .use(cors({ origin: CORS_ORIGIN }))
  .ws("/ws", {
    open(ws) {
      console.log("[ws] new connection");
    },
    message(ws, raw) {
      let data: ClientMessage;
      try {
        data =
          typeof raw === "string" ? JSON.parse(raw) : (raw as ClientMessage);
      } catch {
        return;
      }

      switch (data.type) {
        case "JOIN": {
          const role = data.role;
          if (role !== "dandouch" && role !== "dandoucha") return;

          clients.set(getStableKey(ws), role);

          if (role === "dandouch") {
            room.dandouchConnected = true;
          } else {
            room.dandouchaConnected = true;
          }

          console.log(`[ws] ${role} joined`);

          // Notify partner
          broadcast({ type: "PARTNER_CONNECTED" }, getStableKey(ws));

          // If dandouch joins, send current stage so they're in sync
          if (role === "dandouch" && room.dandouchaConnected) {
            sendTo(ws, { type: "PARTNER_CONNECTED" });
            sendTo(ws, {
              type: "STAGE_SYNC",
              stage: room.dandouchaStage,
            });
          }

          // If dandoucha joins and dandouch is connected, let her know
          if (role === "dandoucha" && room.dandouchConnected) {
            sendTo(ws, { type: "PARTNER_CONNECTED" });
          }

          break;
        }

        case "HEART_START": {
          const role = clients.get(getStableKey(ws));
          console.log("heart start role:", role);
          if (!role) return;

          room.heartHeld[role] = true;
          broadcast({ type: "HEART_START", role }, getStableKey(ws));

          // Check if both hearts are held
          if (room.heartHeld.dandouch && room.heartHeld.dandoucha) {
            // Broadcast TOGETHER to both (including sender)
            const togetherMsg: ServerMessage = {
              type: "TOGETHER",
              active: true,
            };
            for (const [client] of clients) {
              sendTo(client, togetherMsg);
            }
          }

          break;
        }

        case "HEART_STOP": {
          const role = clients.get(getStableKey(ws));
          if (!role) return;

          const wasTogether =
            room.heartHeld.dandouch && room.heartHeld.dandoucha;
          room.heartHeld[role] = false;
          broadcast({ type: "HEART_STOP", role }, getStableKey(ws));

          if (wasTogether) {
            const togetherMsg: ServerMessage = {
              type: "TOGETHER",
              active: false,
            };
            for (const [client] of clients) {
              sendTo(client, togetherMsg);
            }
          }

          break;
        }

        case "NEW_WHISPER": {
          const role = clients.get(getStableKey(ws));
          if (!role || !data.text) return;

          broadcast({ type: "NEW_WHISPER", text: data.text, from: role }, getStableKey(ws));
          break;
        }

        case "STAGE_SYNC": {
          const role = clients.get(getStableKey(ws));
          if (role !== "dandoucha" || !data.stage) return;

          room.dandouchaStage = data.stage;
          broadcast({ type: "STAGE_SYNC", stage: data.stage }, getStableKey(ws));
          break;
        }
      }
    },
    close(ws) {
      const role = clients.get(getStableKey(ws));
      if (role) {
        console.log(`[ws] ${role} disconnected`);
        if (role === "dandouch") {
          room.dandouchConnected = false;
          room.heartHeld.dandouch = false;
        } else {
          room.dandouchaConnected = false;
          room.heartHeld.dandoucha = false;
        }
        clients.delete(getStableKey(ws));
        broadcast({ type: "PARTNER_DISCONNECTED" });
      }
    },
  })
  .get("/health", () => ({ status: "ok" }))
  .listen({ port: PORT, hostname: "0.0.0.0" });

function getLocalNetworkIP(): string | null {
  const nets = networkInterfaces();
  for (const addresses of Object.values(nets)) {
    if (!addresses) continue;
    for (const addr of addresses) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
}

const networkIP = getLocalNetworkIP();
console.log(`🌹 Dandouch server running on port ${PORT}`);
console.log(`   Local:   http://127.0.0.1:${PORT}`);
console.log(
  `   Network: http://${networkIP ?? "<no-network>"}:${PORT}`
);
