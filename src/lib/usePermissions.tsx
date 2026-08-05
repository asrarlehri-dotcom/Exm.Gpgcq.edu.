"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

type PermissionMap = Record<string, boolean>;

interface PermissionsContextValue {
  permissions: PermissionMap;
  role: string;
  loading: boolean;
  /** Check if current user can perform action on module */
  can: (module: string, action: string) => boolean;
  /** Reload permissions (after admin changes them) */
  refresh: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: {},
  role: "GUEST",
  loading: true,
  can: () => false,
  refresh: () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [role, setRole] = useState("GUEST");
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/me/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions ?? {});
        setRole(data.role ?? "GUEST");
      }
    } catch {
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      fetchPermissions();
    }
  }, [status, session]);

  const can = (module: string, action: string): boolean => {
    const userRole = (session?.user as any)?.role;
    if (userRole === "SUPER_ADMIN") return true;
    return permissions[`${module}.${action}`] === true;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, role, loading, can, refresh: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
