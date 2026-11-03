"use client";

import { useEffect, useState } from "react";

export type AuthUser = { id: string; displayName: string };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { ok?: boolean; user?: AuthUser | null }) => {
        if (!active) return;
        setUser(data.user ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
