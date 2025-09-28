import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Local storage keys (global, not per-user since this is a global counter)
const PENDING_DELTA_KEY = "prompt_counter_pending_delta";
const LOCAL_FALLBACK_TOTAL_KEY = "prompt_counter_local_total";

const readNumber = (key: string, def = 0) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) ? n : def;
  } catch {
    return def;
  }
};

const writeNumber = (key: string, value: number) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export function usePromptCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rowIdRef = useRef<string | null>(null);

  const fetchCurrent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("prompt_counter")
        .select("id,total,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from("prompt_counter")
          .insert({ total: 0 })
          .select("id,total")
          .single();
        if (insertError) throw insertError;
        setTotal(inserted.total);
        writeNumber(LOCAL_FALLBACK_TOTAL_KEY, Math.max(inserted.total, readNumber(LOCAL_FALLBACK_TOTAL_KEY, 0)));
        rowIdRef.current = inserted.id;
      } else {
        setTotal(data.total);
        writeNumber(LOCAL_FALLBACK_TOTAL_KEY, Math.max(data.total, readNumber(LOCAL_FALLBACK_TOTAL_KEY, 0)));
        rowIdRef.current = data.id;
      }
    } catch (e: any) {
      // Fallback to local cached value
      setError(e?.message || "Failed to fetch counter");
      const local = readNumber(LOCAL_FALLBACK_TOTAL_KEY, 0);
      const pending = readNumber(PENDING_DELTA_KEY, 0);
      setTotal(local + pending);
    } finally {
      setLoading(false);
    }
  }, []);

  const flushPending = useCallback(async () => {
    const pending = readNumber(PENDING_DELTA_KEY, 0);
    if (!pending) return;

    try {
      const { data, error } = await supabase.rpc("increment_prompt_counter", { delta: pending });
      if (error) throw error;
      const newTotal = Array.isArray(data) && data[0]?.total != null ? data[0].total : undefined;
      if (typeof newTotal === "number") {
        setTotal(newTotal);
        writeNumber(LOCAL_FALLBACK_TOTAL_KEY, newTotal);
      }
      writeNumber(PENDING_DELTA_KEY, 0);
    } catch {
      // stay pending
    }
  }, []);

  const increment = useCallback(async (delta = 1) => {
    try {
      const { data, error } = await supabase.rpc("increment_prompt_counter", { delta });
      if (error) throw error;
      const newTotal = Array.isArray(data) && data[0]?.total != null ? data[0].total : undefined;
      if (typeof newTotal === "number") {
        setTotal(newTotal);
        writeNumber(LOCAL_FALLBACK_TOTAL_KEY, newTotal);
      } else {
        // As a fallback, just bump locally
        setTotal((t) => (t ?? 0) + delta);
        writeNumber(LOCAL_FALLBACK_TOTAL_KEY, (readNumber(LOCAL_FALLBACK_TOTAL_KEY, 0) + delta));
      }
    } catch {
      // Offline/failed: accumulate pending and update UI optimistically
      const currentPending = readNumber(PENDING_DELTA_KEY, 0);
      writeNumber(PENDING_DELTA_KEY, currentPending + delta);
      setTotal((t) => (t ?? 0) + delta);
    }
  }, []);

  useEffect(() => {
    fetchCurrent().then(() => flushPending());

    // Realtime subscribe
    const channel = supabase
      .channel("prompt-counter")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prompt_counter" },
        (payload: any) => {
          const row = (payload.new || payload.old) as { id?: string; total?: number };
          if (row?.id && rowIdRef.current && row.id !== rowIdRef.current) {
            return; // Ignore changes for other rows
          }
          if (typeof row?.total === "number") {
            const pending = readNumber(PENDING_DELTA_KEY, 0);
            const incoming = row.total + pending;
            setTotal((t) => Math.max(t ?? 0, incoming));
            const cached = readNumber(LOCAL_FALLBACK_TOTAL_KEY, 0);
            if (row.total > cached) {
              writeNumber(LOCAL_FALLBACK_TOTAL_KEY, row.total);
            }
          } else {
            // If no total, re-fetch
            fetchCurrent();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    const onOnline = () => flushPending();
    window.addEventListener("online", onOnline);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      window.removeEventListener("online", onOnline);
    };
  }, [fetchCurrent, flushPending]);

  return useMemo(
    () => ({ total, loading, error, increment }),
    [total, loading, error, increment]
  );
}
