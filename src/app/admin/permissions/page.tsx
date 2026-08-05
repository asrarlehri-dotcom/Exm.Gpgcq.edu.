"use client";

import { useState, useEffect } from "react";
import { MODULES, ACTIONS, ROLES } from "@/lib/permissions";

export default function PermissionsPanelPage() {
  const [activeRole, setActiveRole] = useState<string>("BS_CONTROLLER");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
        setRolePerms(data.rolePerms);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPermissionStatus = (module: string, action: string) => {
    const perm = rolePerms.find(
      (rp) => rp.role === activeRole && rp.permission?.module === module && rp.permission?.action === action
    );
    return perm ? perm.isGranted : false;
  };

  const handleToggle = (module: string, action: string) => {
    setRolePerms((prev) => {
      const existingIdx = prev.findIndex(
        (rp) => rp.role === activeRole && rp.permission?.module === module && rp.permission?.action === action
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          isGranted: !updated[existingIdx].isGranted,
        };
        return updated;
      } else {
        // Find permission reference
        const pRef = permissions.find((p) => p.module === module && p.action === action);
        return [
          ...prev,
          {
            role: activeRole,
            permissionId: pRef?.id,
            permission: pRef,
            isGranted: true,
          },
        ];
      }
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSuccess("");

    // Gather updates for active role
    const activeRoleUpdates = rolePerms
      .filter((rp) => rp.role === activeRole)
      .map((rp) => ({
        module: rp.permission.module,
        action: rp.permission.action,
        isGranted: rp.isGranted,
      }));

    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          updates: activeRoleUpdates,
        }),
      });

      if (res.ok) {
        setSuccess("Permissions matrix updated successfully!");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      alert("Failed to save changes.");
    }
    setSaving(false);
  };

  // Group modules for cleaner representation
  const moduleKeys = Array.from(new Set(permissions.map((p) => p.module)));
  const actionKeys = Object.values(ACTIONS);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic RBAC Permission Matrix</h1>
          <p className="text-gray-500 mt-1">
            Configure system-wide module-level and action-level credentials dynamically.
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={saving || loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          {saving ? "Saving Changes..." : "Save Matrix changes"}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="flex border-b overflow-x-auto bg-gray-50/50 rounded-t-2xl">
        {Object.values(ROLES)
          .filter((r) => r !== "SUPER_ADMIN") // Super Admin has hardcoded full bypass
          .map((r) => (
            <button
              key={r}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all ${
                activeRole === r
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveRole(r)}
            >
              👤 {r.replace(/_/g, " ")}
            </button>
          ))}
      </div>

      {/* Permissions Grid */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-16 text-gray-400">Loading permission definitions...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-4 font-bold text-gray-700 w-80">Module / Resource Name</th>
                  {actionKeys.map((action) => (
                    <th key={action} className="px-3 py-4 text-center font-bold text-gray-600 text-xs">
                      {action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleKeys.map((module) => (
                  <tr key={module} className="border-b hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-800 text-xs tracking-wider">
                      {module}
                    </td>
                    {actionKeys.map((action) => {
                      const granted = getPermissionStatus(module, action);
                      return (
                        <td key={action} className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggle(module, action)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              granted
                                ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                : "bg-red-50 text-red-400 hover:bg-red-100 border border-red-200"
                            }`}
                          >
                            {granted ? "✓" : "✗"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
