"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { setRemoteUser } from "@/lib/user-store";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface SessionState {
  user: SessionUser | null;
  /** True sampai pemeriksaan sesi pertama selesai. */
  loading: boolean;
  /** Panggil ulang setelah login/logout tanpa memuat ulang halaman. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  refresh: async () => {},
});

/**
 * Sumber kebenaran sesi di sisi klien.
 *
 * Sengaja tidak membaca cookie di root layout: kalau begitu, SELURUH halaman
 * yang saat ini statis/ISR harus dirender dinamis. Cukup satu permintaan
 * ringan ke /api/me setelah hidrasi. Efek sampingnya: data riwayat/daftar
 * tonton ikut berpindah antara localStorage dan database.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const lastLoaded = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw new Error("gagal");
      const data = (await res.json()) as { user: SessionUser | null };
      setUser(data.user);
      await setRemoteUser(data.user?.id ?? null);
    } catch {
      setUser(null);
      await setRemoteUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Setelah login/logout, navigasi hanya mengganti RSC tanpa memuat ulang
  // seluruh dokumen — periksa ulang sesi saat rute berubah.
  useEffect(() => {
    if (lastLoaded.current === null) {
      lastLoaded.current = pathname;
      return;
    }
    if (lastLoaded.current === pathname) return;
    lastLoaded.current = pathname;
    void load();
  }, [pathname, load]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
