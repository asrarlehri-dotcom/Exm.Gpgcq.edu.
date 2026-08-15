"use client";

import { SessionProvider } from "next-auth/react";
import { PermissionsProvider } from "@/lib/usePermissions";
import { AdminUnlockNotifier } from "@/components/AdminUnlockNotifier";
import { FacultyDutyNotifier } from "@/components/FacultyDutyNotifier";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionsProvider>
        {children}
        <AdminUnlockNotifier />
        <FacultyDutyNotifier />
      </PermissionsProvider>
    </SessionProvider>
  );
}
