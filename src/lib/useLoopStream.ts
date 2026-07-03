"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { insforge } from "./insforge";
import { getIterations } from "./loops";
import type { LoopIteration } from "./types";

type ConnState = "disconnected" | "connecting" | "connected";

/**
 * Subscribes to `loop:<sessionId>` and keeps a live list of that session's
 * iterations. The DB trigger publishes INSERT_iteration / UPDATE_iteration
 * events (id + result only), so on each event we refetch the full rows.
 */
export function useLoopStream(sessionId: string | null) {
  const [iterations, setIterations] = useState<LoopIteration[]>([]);
  const [conn, setConn] = useState<ConnState>("disconnected");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(sessionId);
  sessionRef.current = sessionId;

  const refetch = useCallback(async () => {
    const id = sessionRef.current;
    if (!id) return;
    const rows = await getIterations(id);
    setIterations(rows);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setIterations([]);
      setConn("disconnected");
      return;
    }

    let cancelled = false;
    const channel = `loop:${sessionId}`;

    const onIteration = () => {
      void refetch();
    };
    const onConnect = () => setConn("connected");
    const onDisconnect = () => setConn("disconnected");

    (async () => {
      setLoading(true);
      const rows = await getIterations(sessionId);
      if (cancelled) return;
      setIterations(rows);
      setLoading(false);

      setConn("connecting");
      try {
        insforge.realtime.on("connect", onConnect);
        insforge.realtime.on("disconnect", onDisconnect);
        insforge.realtime.on("INSERT_iteration", onIteration);
        insforge.realtime.on("UPDATE_iteration", onIteration);

        const res = await insforge.realtime.subscribe(channel);
        if (cancelled) return;
        setConn(res?.ok ? "connected" : "disconnected");
      } catch {
        if (!cancelled) setConn("disconnected");
      }
    })();

    return () => {
      cancelled = true;
      insforge.realtime.off("connect", onConnect);
      insforge.realtime.off("disconnect", onDisconnect);
      insforge.realtime.off("INSERT_iteration", onIteration);
      insforge.realtime.off("UPDATE_iteration", onIteration);
      insforge.realtime.unsubscribe(channel);
    };
  }, [sessionId, refetch]);

  return { iterations, conn, loading, refetch };
}
