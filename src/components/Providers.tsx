"use client";

import { SessionProvider } from "next-auth/react";
import { PermissionsProvider } from "@/lib/usePermissions";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionsProvider>
        {children}
      </PermissionsProvider>
    </SessionProvider>
  );
}
