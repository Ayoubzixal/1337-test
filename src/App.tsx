import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Link } from "react-router-dom";
import { Terminal, Shield, Lock, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./lib/utils";

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

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono overflow-hidden">
      <div className="w-full max-w-[1024px] h-[768px] bg-[#050505] p-8 flex flex-col relative overflow-hidden border border-[#00FF41]/10">
        <div className="scanline" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 border-b border-[#00FF41]/30 pb-4 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-[#00FF41]">
              ELITE HACKER INTAKE <span className="animate-pulse">_</span>
            </h1>
            <p className="text-xs text-[#00FF41]/60 uppercase tracking-widest mt-1">
              Security Recruitment Portal // V 2.4.0
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1 justify-end">
              <span className="text-[10px] text-[#00FF41]/60">CREATORS:</span>
              <span className="text-sm font-bold text-[#00FF41]">AYOUB & RACHID</span>
            </div>
            <div className="flex items-center gap-4 justify-end">
              <Link to="/admin" className="text-[10px] text-[#00FF41]/60 hover:text-[#00FF41] hover:underline underline-offset-4">
                ADMIN_ACCESS
              </Link>
              <div className="admin-badge inline-block">SYSTEM ACTIVE</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center items-center z-10 relative">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-6 flex justify-between items-end border-t border-[#00FF41]/30 pt-4 text-[10px] uppercase z-10 text-[#00FF41]">
          <div className="flex flex-col">
            <span>LATENCY: 12ms</span>
            <span>UPLINK: STABLE</span>
          </div>
          <div className="text-right">
            <span>PROPERTY OF ELITE_WHITE_HAT_CORP</span><br/>
            <span className="text-[#00FF41]/40">DEVELOPED BY AYOUB & RACHID SECURITY LABS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [registeredRooms, setRegisteredRooms] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Poll state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setState(data);
      } catch (err) {
        console.error("Failed to fetch state:", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (roomId: number) => {
    if (registeredRooms.has(roomId)) return;
    
    setActionLoading(roomId);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      
      if (res.ok) {
        setRegisteredRooms(prev => new Set(prev).add(roomId));
        // Optimistically update local state to avoid waiting for next poll
        setState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rooms: prev.rooms.map(r => r.id === roomId ? { ...r, guests: r.guests + 1 } : r)
          };
        });
      }
    } catch (err) {
      console.error("Failed to register:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const threatLevels = ["LOW", "MED", "HIGH", "CRIT"];

  return (
    <MainLayout>
      <div className="w-[860px] h-[520px] glow-border bg-black/40 backdrop-blur-sm relative flex flex-col">
        <div className="absolute -top-3 left-6 bg-[#050505] px-4 text-xs font-bold text-[#00FF41]">
          HACKER_ACCESS_TERMINAL
        </div>
        
        <div className="p-4 border-b border-[#00FF41]/30 flex justify-between items-center bg-[#00FF41]/5">
          <div className="flex gap-4 text-[10px] tracking-widest text-[#00FF41]">
            <span>USER: UNIDENTIFIED</span>
            <span className="text-[#00FF41]/60">AUTH_CODE: AWAITING</span>
            <span>STATUS: {state?.isActive ? "BYPASS_ACTIVE" : "STANDBY"}</span>
          </div>
          <div className="flex gap-1">
            <div className={cn("w-2 h-2 rounded-full", state?.isActive ? "bg-[#00FF41]" : "bg-[#003B00]")}></div>
            <div className={cn("w-2 h-2 rounded-full", state?.isActive ? "bg-[#00FF41]/40" : "bg-[#003B00]")}></div>
            <div className={cn("w-2 h-2 rounded-full", state?.isActive ? "bg-[#00FF41]/20" : "bg-[#003B00]")}></div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {!state ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-[#00FF41] animate-pulse">CONNECTING TO SECURE MAINFRAME...</span>
            </div>
          ) : !state.isActive ? (
            <div className="flex flex-col justify-center items-center h-full">
              <Lock className="w-16 h-16 text-[#003B00] mb-4" />
              <p className="text-[#00FF41] font-bold uppercase tracking-widest text-lg">Waiting for Admin Signal</p>
              <p className="text-[#00FF41]/60 text-sm mt-2">SYSTEM STANDBY <span className="animate-blink">_</span></p>
            </div>
          ) : (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="h-full flex flex-col"
             >
                <table className="w-full text-left border-collapse block overflow-y-auto h-full">
                  <thead className="text-[11px] uppercase text-[#00FF41]/50 border-b border-[#00FF41]/30 table w-full table-fixed">
                    <tr>
                      <th className="pb-3 font-medium w-16">ID</th>
                      <th className="pb-3 font-medium">SECTOR / ROOM</th>
                      <th className="pb-3 font-medium w-64">LOAD_CAPACITY</th>
                      <th className="pb-3 font-medium w-32">THREAT_LEVEL</th>
                      <th className="pb-3 font-medium text-right w-48">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm block w-full">
                    {state.rooms.map((room, index) => {
                      const isRegistered = registeredRooms.has(room.id);
                      const isFull = room.guests >= room.max;
                      const isLast = index === state.rooms.length - 1;
                      
                      return (
                        <tr key={room.id} className={cn("room-row table w-full table-fixed", isLast && "border-none")}>
                          <td className="py-4 font-bold w-16">0{room.id}</td>
                          <td className="py-4">{room.name}</td>
                          <td className="py-4 w-64">
                            <div className={cn("flex items-center gap-2", isFull ? "text-[#00FF41]/60" : "text-[#00FF41]")}>
                              {room.guests} / {room.max} 
                              <div className="w-24 h-1 bg-[#003B00] rounded-full overflow-hidden">
                                <div className="h-full bg-[#00FF41]" style={{ width: `${(room.guests / room.max) * 100}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-xs w-32">{threatLevels[(room.id - 1) % 4]}</td>
                          <td className="py-4 text-right w-48">
                            <button
                              onClick={() => handleRegister(room.id)}
                              disabled={isRegistered || isFull || actionLoading === room.id}
                              className={cn(
                                "uppercase",
                                isRegistered 
                                  ? "btn-register btn-completed" 
                                  : isFull
                                    ? "btn-register btn-completed opacity-40 cursor-not-allowed"
                                    : "btn-register"
                              )}
                            >
                              {actionLoading === room.id ? (
                                "PROCESSING..."
                              ) : isRegistered ? (
                                "COMPLETED IN ON ROOM GO"
                              ) : isFull ? (
                                "LOCKED"
                              ) : (
                                "REGISTER"
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </motion.div>
          )}
        </div>
        
        <div className="p-2 bg-[#00FF41]/10 text-[9px] uppercase tracking-[0.2em] text-center text-[#00FF41]">
          {state?.isActive ? "Awaiting candidate selections..." : "Waiting for candidates to initialize connection..."}
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
    
    const fetchState = async () => {
      const res = await fetch("/api/state");
      const data = await res.json();
      setState(data);
    };
    
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code }),
    });
    
    const data = await res.json();
    if (data.success) {
      setToken(data.token);
      localStorage.setItem("admin_token", data.token);
    } else {
      setError(data.message);
    }
  };

  const toggleWindow = async () => {
    await fetch("/api/admin/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
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
            <h2 className="text-2xl font-bold uppercase tracking-widest text-center text-[#00FF41]">Admin Access</h2>
            <p className="text-xs text-[#00FF41]/70 mt-2 uppercase">Restricted Area</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase text-[#00FF41]/60 mb-2">Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-[#00FF41]/40 p-3 text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#00FF41]/60 mb-2">Code</label>
              <input 
                type="password" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-black border border-[#00FF41]/40 p-3 text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
              />
            </div>
            
            {error && <div className="text-[#050505] text-sm font-bold uppercase p-2 border border-[#00FF41] bg-[#00FF41]">{error}</div>}
            
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
      <div className="w-[860px] max-w-full z-10 relative">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold uppercase text-[#00FF41]">Control Panel</h2>
          <button 
            onClick={logout}
            className="text-sm text-[#00FF41]/60 hover:text-[#00FF41] underline decoration-[#00FF41]/40 underline-offset-4"
          >
            TERMINATE SESSION
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glow-border bg-black/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center h-64">
            <h3 className="text-lg text-[#00FF41]/60 mb-4 uppercase">Main Window Status</h3>
            <div className={cn(
              "text-3xl font-bold mb-8 uppercase tracking-widest",
              state?.isActive ? "text-[#00FF41] drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]" : "text-[#003B00]"
            )}>
              {state?.isActive ? "ACTIVE" : "STANDBY"}
            </div>
            <button
              onClick={toggleWindow}
              className={cn(
                "px-8 py-3 uppercase font-bold transition-all",
                state?.isActive 
                  ? "bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41]/10" 
                  : "bg-[#00FF41] border border-[#00FF41] text-[#050505] hover:bg-[#00cc33]"
              )}
            >
              {state?.isActive ? "DEACTIVATE WINDOW" : "ACTIVATE WINDOW"}
            </button>
          </div>

          <div className="glow-border bg-black/40 backdrop-blur-sm p-6 h-64 overflow-y-auto text-[#00FF41]">
            <h3 className="text-sm text-[#00FF41]/60 mb-4 uppercase inline-block border-b border-[#00FF41]/40 pb-2">Live Room Telemetry</h3>
            <div className="space-y-3">
              {!state ? (
                <div className="text-sm text-[#003B00]">No telemetry...</div>
              ) : state.rooms.map(room => (
                <div key={room.id} className="flex justify-between items-center text-sm border-b border-[#00FF41]/20 pb-2">
                  <span className="text-[#00FF41]">{room.name}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-[#003B00] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00FF41] transition-all duration-500" 
                        style={{ width: `${(room.guests / room.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#00FF41] w-12 text-right font-bold">{room.guests}/{room.max}</span>
                  </div>
                </div>
              ))}
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
