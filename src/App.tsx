import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import { Terminal, Shield, Lock, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./lib/utils";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

// Types
interface Room {
  id: number;
  name: string;
  guests: number;
  max: number;
}

interface AppState {
  isActive: boolean;
  rooms: Room[];
}

const DEFAULT_STATE: AppState = {
  isActive: false,
  rooms: Array.from({ length: 7 }).map((_, i) => ({
    id: i + 1,
    name: `SECTOR_0${i + 1}`,
    guests: 0,
    max: 100,
  })),
};

function MainLayout({ children, isActive }: { children: React.ReactNode, isActive?: boolean }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono overflow-auto p-2 sm:p-4">
      <div className="w-full max-w-[1024px] min-h-[calc(100vh-16px)] sm:min-h-0 sm:h-[768px] bg-[#050505] p-4 sm:p-8 flex flex-col relative overflow-hidden border border-[#00FF41]/10">
        <div className="scanline hidden sm:block" />

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#00FF41]/30 pb-4 z-10 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tighter text-[#00FF41]">
              ELITE HACKER INTAKE <span className="animate-pulse">_</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-[#00FF41]/60 uppercase tracking-widest mt-1">
              Security Recruitment Portal // V 2.4.0
            </p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <div className="flex items-center gap-2 mb-2 sm:mb-1 justify-between sm:justify-end border-b border-[#00FF41]/20 sm:border-none pb-2 sm:pb-0">
              <span className="text-[10px] text-[#00FF41]/60">CREATORS:</span>
              <span className="text-xs sm:text-sm font-bold text-[#00FF41]">
                AYOUB & RACHID
              </span>
            </div>
            <div className="flex items-center gap-4 justify-between sm:justify-end">
              <Link
                to="/admin"
                className="text-[10px] text-[#00FF41]/60 hover:text-[#00FF41] hover:underline underline-offset-4"
              >
                ADMIN_ACCESS
              </Link>
              <div className="admin-badge inline-block text-[10px] sm:text-xs px-2 py-0.5">
                SYSTEM {isActive ? "ACTIVE" : "STANDBY"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center items-center z-10 relative overflow-hidden">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-end border-t border-[#00FF41]/30 pt-4 text-[10px] uppercase z-10 text-[#00FF41] shrink-0">
          <div className="flex flex-row sm:flex-col gap-4 sm:gap-0 w-full sm:w-auto justify-between sm:justify-start border-b border-[#00FF41]/10 sm:border-none pb-2 sm:pb-0">
            <span>LATENCY: 12ms</span>
            <span>UPLINK: STABLE</span>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <span>PROPERTY OF ELITE_WHITE_HAT_CORP</span>
            <br className="hidden sm:block" />
            <span className="text-[#00FF41]/40 block sm:inline mt-1 sm:mt-0">
              DEVELOPED BY AYOUB & RACHID SECURITY LABS
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [registeredRooms, setRegisteredRooms] = useState<Set<number>>(
    new Set(JSON.parse(localStorage.getItem("registered_rooms") || "[]"))
  );
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Sync state with Firestore
  useEffect(() => {
    let unsubscribe = () => {};
    const initDb = async () => {
      try {
        const stateRef = doc(db, "state", "main");
        const docSnap = await getDoc(stateRef);
        if (!docSnap.exists()) {
           await setDoc(stateRef, DEFAULT_STATE);
        }
        
        unsubscribe = onSnapshot(stateRef, (docSnap) => {
          if (docSnap.exists()) {
            setState(docSnap.data() as AppState);
          }
        }, (error) => {
           console.error("Firestore Error: ", error);
        });
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initDb();
    return () => unsubscribe();
  }, []);

  // Update localStorage when registering
  useEffect(() => {
    localStorage.setItem("registered_rooms", JSON.stringify(Array.from(registeredRooms)));
  }, [registeredRooms]);

  const handleRegister = async (roomId: number) => {
    if (registeredRooms.has(roomId) || !state) return;
    
    setActionLoading(roomId);
    
    // Add to local registered rooms
    setRegisteredRooms((prev) => new Set(prev).add(roomId));
    
    try {
      const stateRef = doc(db, "state", "main");
      const currentState = await getDoc(stateRef);
      if (currentState.exists()) {
        const data = currentState.data() as AppState;
        const newRooms = data.rooms.map((r) => 
          r.id === roomId ? { ...r, guests: Math.min(r.guests + 1, r.max) } : r
        );
        
        await setDoc(stateRef, {
          isActive: data.isActive,
          rooms: newRooms
        });
      }
    } catch (err) {
      console.error("Failed to register in firestore:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const threatLevels = ["LOW", "MED", "HIGH", "CRIT"];

  return (
    <MainLayout isActive={state?.isActive}>
      <div className="w-full max-w-[860px] h-full sm:h-[520px] glow-border bg-black/40 backdrop-blur-sm relative flex flex-col overflow-hidden">
        <div className="absolute -top-3 left-2 sm:left-6 bg-[#050505] px-2 sm:px-4 text-[10px] sm:text-xs font-bold text-[#00FF41]">
          HACKER_ACCESS_TERMINAL
        </div>

        <div className="p-3 sm:p-4 border-b border-[#00FF41]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#00FF41]/5 gap-2">
          <div className="flex flex-wrap gap-2 sm:gap-4 text-[9px] sm:text-[10px] tracking-widest text-[#00FF41]">
            <span>USER: UNIDENTIFIED</span>
            <span className="text-[#00FF41]/60">AUTH_CODE: AWAITING</span>
            <span>STATUS: {state?.isActive ? "BYPASS_ACTIVE" : "STANDBY"}</span>
          </div>
          <div className="flex gap-1 self-end sm:self-auto hidden sm:flex">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                state?.isActive ? "bg-[#00FF41]" : "bg-[#003B00]",
              )}
            ></div>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                state?.isActive ? "bg-[#00FF41]/40" : "bg-[#003B00]",
              )}
            ></div>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                state?.isActive ? "bg-[#00FF41]/20" : "bg-[#003B00]",
              )}
            ></div>
          </div>
        </div>

        <div className="flex-1 p-2 sm:p-6 overflow-hidden flex flex-col">
          {!state ? (
            <div className="flex justify-center items-center h-full flex-1">
              <span className="text-[#00FF41] animate-pulse text-xs sm:text-sm">
                CONNECTING TO SECURE MAINFRAME...
              </span>
            </div>
          ) : !state.isActive ? (
            <div className="flex flex-col justify-center items-center h-full flex-1 text-center p-4">
              <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-[#003B00] mb-4" />
              <p className="text-[#00FF41] font-bold uppercase tracking-widest text-base sm:text-lg">
                Waiting for Admin Signal
              </p>
              <p className="text-[#00FF41]/60 text-xs sm:text-sm mt-2">
                SYSTEM STANDBY <span className="animate-blink">_</span>
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col overflow-auto"
            >
              <div className="min-w-[600px] sm:min-w-0 h-full flex flex-col pl-2 pr-2 sm:pr-0">
                <table className="w-full text-left border-collapse block overflow-y-auto h-full pr-0 sm:pr-2">
                  <thead className="text-[10px] sm:text-[11px] uppercase text-[#00FF41]/50 border-b border-[#00FF41]/30 table w-full table-fixed sticky top-0 bg-[#050505]">
                    <tr>
                      <th className="pb-3 font-medium w-12 sm:w-16">ID</th>
                      <th className="pb-3 font-medium">SECTOR / ROOM</th>
                      <th className="pb-3 font-medium w-32 sm:w-64">
                        LOAD_CAPACITY
                      </th>
                      <th className="pb-3 font-medium w-24 sm:w-32">
                        THREAT_LEVEL
                      </th>
                      <th className="pb-3 font-medium text-right w-32 sm:w-48">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs sm:text-sm block w-full pt-2">
                    {state.rooms.map((room, index) => {
                      const isRegistered = registeredRooms.has(room.id);
                      const isFull = room.guests >= room.max;
                      const isLast = index === state.rooms.length - 1;

                      return (
                        <tr
                          key={room.id}
                          className={cn(
                            "room-row table w-full table-fixed",
                            isLast && "border-none",
                          )}
                        >
                          <td className="py-3 sm:py-4 font-bold w-12 sm:w-16">
                            0{room.id}
                          </td>
                          <td className="py-3 sm:py-4 truncate pr-2">
                            {room.name}
                          </td>
                          <td className="py-3 sm:py-4 w-32 sm:w-64 pr-2">
                            <div
                              className={cn(
                                "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2",
                                isFull ? "text-[#00FF41]/60" : "text-[#00FF41]",
                              )}
                            >
                              <span className="text-[10px] sm:text-sm whitespace-nowrap">
                                {room.guests} / {room.max}
                              </span>
                              <div className="w-16 sm:w-24 h-1 bg-[#003B00] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#00FF41]"
                                  style={{
                                    width: `${(room.guests / room.max) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 text-[10px] sm:text-xs w-24 sm:w-32">
                            {threatLevels[(room.id - 1) % 4]}
                          </td>
                          <td className="py-3 sm:py-4 text-right w-32 sm:w-48">
                            <button
                              onClick={() => handleRegister(room.id)}
                              disabled={
                                isRegistered ||
                                isFull ||
                                actionLoading === room.id
                              }
                              className={cn(
                                "uppercase text-[9px] sm:text-[10px] md:text-[11px] px-1 sm:px-3 py-1.5 sm:py-2",
                                isRegistered
                                  ? "btn-register btn-completed"
                                  : isFull
                                    ? "btn-register btn-completed opacity-40 cursor-not-allowed"
                                    : "btn-register",
                              )}
                            >
                              {actionLoading === room.id
                                ? "WORKING..."
                                : isRegistered
                                  ? "IN ON ROOM"
                                  : isFull
                                    ? "LOCKED"
                                    : "REGISTER"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-2 shrink-0 bg-[#00FF41]/10 text-[8px] sm:text-[9px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-center text-[#00FF41]">
          {state?.isActive
            ? "Awaiting candidate selections..."
            : "Waiting for candidates to initialize connection..."}
        </div>
      </div>
    </MainLayout>
  );
}

function Admin() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [error, setError] = useState("");
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    if (!token) return;

    let unsubscribe = () => {};
    const initDb = async () => {
      try {
        const stateRef = doc(db, "state", "main");
        const docSnap = await getDoc(stateRef);
        if (!docSnap.exists()) {
           await setDoc(stateRef, DEFAULT_STATE);
        }
        
        unsubscribe = onSnapshot(stateRef, (docSnap) => {
          if (docSnap.exists()) {
            setState(docSnap.data() as AppState);
          }
        }, (error) => {
           console.error("Firestore Error: ", error);
        });
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initDb();
    return () => unsubscribe();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Test bypass for ayoub/rachid
    if (
      username.toLowerCase() === "ayoub" &&
      code.toLowerCase() === "rachid"
    ) {
      setToken("ELITE_HACKER_TOKEN_999");
      localStorage.setItem("admin_token", "ELITE_HACKER_TOKEN_999");
    } else {
      setError("ACCESS DENIED");
    }
  };

  const toggleWindow = async () => {
    if (!state) return;
    try {
      const stateRef = doc(db, "state", "main");
      await setDoc(stateRef, {
        isActive: !state.isActive,
        rooms: state.rooms
      });
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
  };

  if (!token) {
    return (
      <MainLayout>
        <div className="w-full max-w-md glow-border bg-black/40 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]/50" />
          <div className="flex flex-col items-center mb-8">
            <ShieldAlert className="w-12 h-12 text-[#00FF41] mb-4 drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]" />
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center text-[#00FF41]">
              Admin Access
            </h2>
            <p className="text-xs text-[#00FF41]/70 mt-2 uppercase">
              Restricted Area
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase text-[#00FF41]/60 mb-2">
                Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-[#00FF41]/40 p-3 text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#00FF41]/60 mb-2">
                Code
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-black border border-[#00FF41]/40 p-3 text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
              />
            </div>

            {error && (
              <div className="text-[#050505] text-sm font-bold uppercase p-2 border border-[#00FF41] bg-[#00FF41]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full border-2 border-[#00FF41] p-3 uppercase font-bold text-[#050505] bg-[#00FF41] hover:bg-[#00cc33] transition-colors"
            >
              Authenticate
            </button>
          </form>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-[860px] z-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2 border-b border-[#00FF41]/20 sm:border-none pb-4 sm:pb-0">
          <h2 className="text-xl sm:text-2xl font-bold uppercase text-[#00FF41]">
            Control Panel
          </h2>
          <button
            onClick={logout}
            className="text-xs sm:text-sm text-[#00FF41]/60 hover:text-[#00FF41] underline decoration-[#00FF41]/40 underline-offset-4"
          >
            TERMINATE SESSION
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="glow-border bg-black/40 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-center text-center h-48 sm:h-64">
            <h3 className="text-sm sm:text-lg text-[#00FF41]/60 mb-2 sm:mb-4 uppercase">
              Main Window Status
            </h3>
            <div
              className={cn(
                "text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 uppercase tracking-widest",
                state?.isActive
                  ? "text-[#00FF41] drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]"
                  : "text-[#003B00]",
              )}
            >
              {state?.isActive ? "ACTIVE" : "STANDBY"}
            </div>
            <button
              onClick={toggleWindow}
              className={cn(
                "px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm uppercase font-bold transition-all w-full sm:w-auto",
                state?.isActive
                  ? "bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41]/10"
                  : "bg-[#00FF41] border border-[#00FF41] text-[#050505] hover:bg-[#00cc33]",
              )}
            >
              {state?.isActive ? "DEACTIVATE WINDOW" : "ACTIVATE WINDOW"}
            </button>
          </div>

          <div className="glow-border bg-black/40 backdrop-blur-sm p-4 sm:p-6 h-48 sm:h-64 flex flex-col items-stretch overflow-hidden text-[#00FF41]">
            <h3 className="text-xs sm:text-sm text-[#00FF41]/60 mb-2 sm:mb-4 uppercase inline-block border-b border-[#00FF41]/40 pb-2 self-start shrink-0">
              Live Room Telemetry
            </h3>
            <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-2 flex-1">
              {!state ? (
                <div className="text-xs sm:text-sm text-[#003B00]">
                  No telemetry...
                </div>
              ) : (
                state.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex justify-between items-center text-xs sm:text-sm border-b border-[#00FF41]/20 pb-2"
                  >
                    <span className="text-[#00FF41] truncate pr-2 max-w-[100px] sm:max-w-[150px]">
                      {room.name}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="w-16 sm:w-32 h-1 sm:h-2 bg-[#003B00] rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-[#00FF41] transition-all duration-500"
                          style={{
                            width: `${(room.guests / room.max) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[#00FF41] w-10 sm:w-12 text-right font-bold text-[10px] sm:text-sm">
                        {room.guests}/{room.max}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
