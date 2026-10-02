"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/onlineApi";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import type { PublicRoom } from "@/server/rooms";

/**
 * Berlangganan perubahan room. Supabase Realtime memberi tahu seketika; polling ringan menjadi
 * cadangan (dan satu-satunya jalur bila Realtime belum dikonfigurasi, mis. saat pengembangan lokal).
 */
export function useRoom(code: string) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [connected, setConnected] = useState(false);
  const [realtime, setRealtime] = useState(false);
  const version = useRef(-1);

  const apply = useCallback((next: PublicRoom) => {
    if (next.version <= version.current) return;
    version.current = next.version;
    setRoom(next);
  }, []);

  const refresh = useCallback(async () => {
    const r = await api.fetchRoom(code, version.current >= 0 ? version.current : undefined);
    if (!r.ok) {
      if (r.status === 404) setNotFound(true);
      setConnected(false);
      return;
    }
    setConnected(true);
    if ("room" in r.data) apply(r.data.room);
  }, [code, apply]);

  useEffect(() => {
    refresh();
    const supabase = getSupabaseBrowser();
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (supabase) {
      channel = supabase
        .channel(`room:${code}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, (payload) => {
          const n = payload.new as Partial<PublicRoom> | undefined;
          // Payload bisa tidak lengkap untuk data besar; bila begitu ambil ulang dari server.
          if (n && n.code && n.players && typeof n.version === "number" && (n.state || n.status === "lobby")) {
            apply(n as PublicRoom);
          } else {
            refresh();
          }
        })
        .subscribe((status) => {
          setRealtime(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") refresh(); // kejar perubahan yang terlewat sebelum tersambung
        });
    }
    // Polling cadangan: tiap 2 dtk tanpa Realtime, tiap 10 dtk bila Realtime aktif; 4x lebih jarang saat tab tersembunyi.
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      const every = (supabase ? 5 : 1) * (document.hidden ? 4 : 1);
      if (tick % every === 0) refresh();
    }, 2000);
    const onVisible = () => !document.hidden && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase?.removeChannel(channel);
    };
  }, [code, apply, refresh]);

  return { room, notFound, connected, realtime, apply, refresh };
}
