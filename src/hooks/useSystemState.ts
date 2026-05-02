import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Room {
  id: number;
  name: string;
  guests: number;
  max: number;
}

export interface AppState {
  isActive: boolean;
  rooms: Room[];
}

export const DEFAULT_STATE: AppState = {
  isActive: false,
  rooms: Array.from({ length: 7 }).map((_, i) => ({
    id: i + 1,
    name: `SECTOR_0${i + 1}`,
    guests: 0,
    max: 100,
  })),
};

export function useSystemState() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    const initDb = async () => {
      try {
        const stateRef = doc(db, "state", "main");
        const docSnap = await getDoc(stateRef);
        if (!docSnap.exists()) {
          await setDoc(stateRef, DEFAULT_STATE);
        }

        unsubscribe = onSnapshot(
          stateRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setState(docSnap.data() as AppState);
            }
          },
          (error) => {
            console.error("Firestore Error: ", error);
          }
        );
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initDb();
    return () => unsubscribe();
  }, []);

  const toggleWindow = async () => {
    if (!state) return;
    try {
      const stateRef = doc(db, "state", "main");
      await setDoc(stateRef, {
        isActive: !state.isActive,
        rooms: state.rooms,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const registerRoom = async (roomId: number) => {
    if (!state) return;
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
          rooms: newRooms,
        });
      }
    } catch (err) {
      console.error("Failed to register in firestore:", err);
      throw err;
    }
  };

  return { state, toggleWindow, registerRoom };
}
