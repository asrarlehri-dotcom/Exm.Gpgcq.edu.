"use client";

import { useState, useEffect } from "react";
import { MODULES, ACTIONS, ROLES } from "@/lib/permissions";

// Type definitions
type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Group = {
  id: string;
  name: string;
  subjects: Subject[];
};

type Program = {
  id: string;
  name: string;
  educationLevel: string;
  groups: Group[];
};

type FeeSetting = {
  id: string;
  key: string;
  label: string;
  amount: number;
  isLocked: boolean;
  description: string | null;
  category: string | null;
};

// Word conversion helper for Fee Settings
function toWords(n: number): string {
  const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"];
  const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n === 0) return "zero";
  if (n < 20) return a[n];
  if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
  if (n < 1000) return a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + toWords(n % 100) : "");
  if (n < 100000) return toWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + toWords(n % 1000) : "");
  return toWords(Math.floor(n / 100000)) + " lakh" + (n % 100000 ? " " + toWords(n % 100000) : "");
}

export default function UnifiedSettingsPage() {
  const [activeTab, setActiveTab] = useState<"ACADEMIC" | "FEES" | "PERMISSIONS">("ACADEMIC");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // ----------------------------------------------------
  // TAB 1: ACADEMIC SETUP STATES & FUNCTIONS
  // ----------------------------------------------------
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramLevel, setNewProgramLevel] = useState("INTERMEDIATE");
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroupTo, setAddingGroupTo] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [addingSubjectTo, setAddingSubjectTo] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      if (res.ok) {
        setPrograms(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAcademicLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName) return;
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProgramName, educationLevel: newProgramLevel }),
      });
      if (res.ok) {
        setNewProgramName("");
        fetchPrograms();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGroup = async (programId: string) => {
    if (!newGroupName) return;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, programId }),
      });
      if (res.ok) {
        setNewGroupName("");
        setAddingGroupTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubject = async (groupId: string) => {
    if (!newSubjectName) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName, code: newSubjectCode || null, groupId }),
      });
      if (res.ok) {
        setNewSubjectName("");
        setNewSubjectCode("");
        setAddingSubjectTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------
  // TAB 2: FEES & SYSTEM SETTINGS STATES & FUNCTIONS
  // ----------------------------------------------------
  const [fees, setFees] = useState<FeeSetting[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  // Global settings state
  const [bankAccount, setBankAccount] = useState("");
  const [sequenceStart, setSequenceStart] = useState("");
  const [rollPattern, setRollPattern] = useState("");
  const [rollSequence, setRollSequence] = useState("");
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setBankAccount(data.CHALLAN_BANK_ACCOUNT || "");
      setSequenceStart(data.CHALLAN_SEQUENCE_CURRENT || "");
      setRollPattern(data.ROLL_NUMBER_PATTERN || "");
      setRollSequence(data.ROLL_SEQUENCE_CURRENT || "");
    }
  };

  const fetchFees = async () => {
    setFeesLoading(true);
    const res = await fetch("/api/fee-settings");
    if (res.ok) setFees(await res.json());
    setFeesLoading(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        CHALLAN_BANK_ACCOUNT: bankAccount,
        CHALLAN_SEQUENCE_CURRENT: sequenceStart,
        ROLL_NUMBER_PATTERN: rollPattern,
        ROLL_SEQUENCE_CURRENT: rollSequence
      }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Global system settings saved successfully." });
      fetchSettings();
    } else {
      setMsg({ type: "error", text: "Failed to save global settings." });
    }
    setUpdatingSettings(false);
  };

  const startEditFee = (fee: FeeSetting) => {
    setEditingFeeId(fee.id);
    setEditAmount(String(fee.amount));
    setEditDesc(fee.description || "");
  };

  const handleSaveFee = async (id: string) => {
    setSavingFee(true);
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal)) {
      alert("Please enter a valid amount.");
      setSavingFee(false);
      return;
    }
    const res = await fetch(`/api/fee-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount: amountVal, description: editDesc }),
    });
    if (res.ok) {
      setEditingFeeId(null);
      fetchFees();
    } else {
      alert("Failed to update fee setting.");
    }
    setSavingFee(false);
  };

  const handleLockFee = async (id: string) => {
    if (!confirm("Are you sure you want to LOCK this fee? Once locked, its amount cannot be changed!")) return;
    const res = await fetch(`/api/fee-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isLocked: true }),
    });
    if (res.ok) {
      fetchFees();
    }
  };

  // ----------------------------------------------------
  // TAB 3: PERMISSIONS STATES & FUNCTIONS
  // ----------------------------------------------------
  const [activeRole, setActiveRole] = useState<string>("BS_CONTROLLER");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<any[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions);
        setRolePerms(data.rolePerms);
      }
    } catch {}
    setPermissionsLoading(false);
  };

  const getPermissionStatus = (module: string, action: string) => {
    const perm = rolePerms.find(
      (rp) => rp.role === activeRole && rp.permission?.module === module && rp.permission?.action === action
    );
    return perm ? perm.isGranted : false;
  };

  const handlePermissionToggle = (module: string, action: string) => {
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

  const handleSavePermissions = async () => {
    setSavingMatrix(true);
    setMsg({ type: "", text: "" });

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
        setMsg({ type: "success", text: "Permissions matrix updated successfully!" });
        fetchPermissions();
      }
    } catch {
      alert("Failed to save changes.");
    }
    setSavingMatrix(false);
  };

  // ----------------------------------------------------
  // INITIAL DATA LIFECYCLE
  // ----------------------------------------------------
  useEffect(() => {
    fetchPrograms();
    fetchSettings();
    fetchFees();
    fetchPermissions();
  }, []);

  // auto clear alert message
  useEffect(() => {
    if (msg.text) {
      const t = setTimeout(() => setMsg({ type: "", text: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  // Tab change handler
  const handleTabChange = (tab: "ACADEMIC" | "FEES" | "PERMISSIONS") => {
    setActiveTab(tab);
    setMsg({ type: "", text: "" });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Control Center & Settings</h1>
          <p className="text-gray-500 mt-1">Manage global system setup, fees structures, and permissions matrix.</p>
        </div>

        {/* Unified Glassmorphism Tab Bar */}
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200/60 max-w-xl">
          <button
            onClick={() => handleTabChange("ACADEMIC")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "ACADEMIC"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🏫 Academic Setup
          </button>
          <button
            onClick={() => handleTabChange("FEES")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "FEES"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            💰 Fee Settings
          </button>
          <button
            onClick={() => handleTabChange("PERMISSIONS")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "PERMISSIONS"
                ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🔐 Permissions Matrix
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {msg.text}
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: ACADEMIC SETUP PANEL
          ---------------------------------------------------- */}
      {activeTab === "ACADEMIC" && (
        <div className="space-y-6">
          {/* Add Program Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Program</h2>
            <form onSubmit={handleAddProgram} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BS Computer Science"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Education Level</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={newProgramLevel}
                  onChange={(e) => setNewProgramLevel(e.target.value)}
                >
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="BS">BS</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                + Add Program
              </button>
            </form>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {academicLoading ? (
              <p className="text-gray-400 text-sm">Loading programs...</p>
            ) : (
              programs.map((p) => (
                <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <span className="text-[10px] uppercase font-bold text-blue-600">{p.educationLevel}</span>
                    </div>
                    {addingGroupTo !== p.id && (
                      <button
                        onClick={() => setAddingGroupTo(p.id)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        + Add Group
                      </button>
                    )}
                  </div>

                  {/* Add Group inline form */}
                  {addingGroupTo === p.id && (
                    <div className="p-3 bg-gray-50 rounded-lg flex gap-2">
                      <input
                        type="text"
                        placeholder="Group Name (e.g. Pre-Medical A)"
                        className="flex-1 px-3 py-1 border rounded text-xs"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <button
                        onClick={() => handleAddGroup(p.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setAddingGroupTo(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Groups list */}
                  <div className="space-y-3">
                    {p.groups.length === 0 ? (
                      <p className="text-gray-400 text-xs italic">No groups registered.</p>
                    ) : (
                      p.groups.map((g) => (
                        <div key={g.id} className="pl-4 border-l-2 border-gray-200 py-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-800">{g.name}</span>
                            {addingSubjectTo !== g.id && (
                              <button
                                onClick={() => setAddingSubjectTo(g.id)}
                                className="text-[10px] text-blue-600 hover:underline"
                              >
                                + Add Course/Subject
                              </button>
                            )}
                          </div>

                          {/* Add Subject inline form */}
                          {addingSubjectTo === g.id && (
                            <div className="p-2 bg-gray-100 rounded flex gap-2 flex-wrap">
                              <input
                                type="text"
                                placeholder="Name (e.g. English)"
                                className="flex-1 min-w-[120px] px-2 py-1 border rounded text-[10px]"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="Code (e.g. ENG-101)"
                                className="w-24 px-2 py-1 border rounded text-[10px]"
                                value={newSubjectCode}
                                onChange={(e) => setNewSubjectCode(e.target.value)}
                              />
                              <button
                                onClick={() => handleAddSubject(g.id)}
                                className="px-2.5 py-1 bg-blue-600 text-white text-[10px] rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setAddingSubjectTo(null)}
                                className="px-2.5 py-1 bg-gray-200 text-gray-700 text-[10px] rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Subjects list */}
                          <div className="flex flex-wrap gap-1.5">
                            {g.subjects.map((sub) => (
                              <span
                                key={sub.id}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] rounded"
                              >
                                {sub.name} {sub.code ? `(${sub.code})` : ""}
                              </span>
                            ))}
                            {g.subjects.length === 0 && (
                              <span className="text-gray-400 text-[10px] italic">No courses added.</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: FEE & SYSTEM SETTINGS PANEL
          ---------------------------------------------------- */}
      {activeTab === "FEES" && (
        <div className="space-y-6">
          {/* Global Challan & Roll Configuration Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">⚙️ Global System Configuration</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bank Account Number (HBL)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Challan Number (Sequence)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                    value={sequenceStart}
                    onChange={(e) => setSequenceStart(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roll Number Pattern</label>
                  <input
                    type="text"
                    required
                    placeholder="[YEAR]-[CODE]-[SEQ]"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    value={rollPattern}
                    onChange={(e) => setRollPattern(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Placeholders: <span className="font-bold font-mono">[YEAR]</span> (session year), <span className="font-bold font-mono">[CODE]</span> (program code), <span className="font-bold font-mono">[SEQ]</span> (sequential sequence).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Student Sequence (Roll Counter)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                    value={rollSequence}
                    onChange={(e) => setRollSequence(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {updatingSettings ? "Saving Settings..." : "💾 Save System Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Fee Amounts Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">💰 Fee Rates & Locks</h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure and lock fee amounts used for auto challan generation.</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold">🔓 Editable</span>
                <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-semibold">🔒 Locked (Fixed)</span>
              </div>
            </div>

            {feesLoading ? (
              <p className="p-6 text-center text-gray-400 text-sm">Loading fee settings...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap w-24">Lock Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap">Fee Category</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap">Fee Label</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap">Amount (PKR)</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap">Amount in Words</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => {
                      const isEditing = editingFeeId === fee.id;
                      return (
                        <tr key={fee.id} className="border-b hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                              fee.isLocked ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                            }`}>
                              {fee.isLocked ? "🔒 Locked" : "🔓 Open"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wide text-xs">{fee.category || "General"}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{fee.label}</div>
                            {isEditing ? (
                              <input
                                type="text"
                                className="mt-1 w-full px-2 py-1 border rounded text-xs"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Note/Description"
                              />
                            ) : (
                              fee.description && <div className="text-xs text-gray-500">{fee.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-gray-800">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-24 px-2 py-1 border rounded text-sm font-bold font-mono focus:ring-blue-500"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                              />
                            ) : (
                              `Rs. ${fee.amount.toLocaleString()}`
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 capitalize italic">
                            {isEditing ? (
                              toWords(parseFloat(editAmount) || 0) + " Rupees Only"
                            ) : (
                              toWords(fee.amount) + " Rupees Only"
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-3">
                              {fee.isLocked ? (
                                <span className="text-xs text-gray-400">Fixed</span>
                              ) : isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveFee(fee.id)}
                                    disabled={savingFee}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingFeeId(null)}
                                    className="text-xs text-gray-500 hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditFee(fee)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleLockFee(fee.id)}
                                    className="text-xs text-red-600 hover:underline font-semibold"
                                  >
                                    Lock Value
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: PERMISSIONS MATRIX PANEL
          ---------------------------------------------------- */}
      {activeTab === "PERMISSIONS" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dynamic RBAC Permission Matrix</h2>
              <p className="text-gray-500 mt-0.5">Configure system-wide module-level and action-level credentials dynamically.</p>
            </div>
            <button
              onClick={handleSavePermissions}
              disabled={savingMatrix || permissionsLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              {savingMatrix ? "Saving Changes..." : "💾 Save Matrix Changes"}
            </button>
          </div>

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
            {permissionsLoading ? (
              <p className="text-center py-16 text-gray-400">Loading permission definitions...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-5 py-4 font-bold text-gray-700 w-80">Module / Resource Name</th>
                      {Object.values(ACTIONS).map((action) => (
                        <th key={action} className="px-3 py-4 text-center font-bold text-gray-600 text-xs">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set(permissions.map((p) => p.module))).map((module) => (
                      <tr key={module} className="border-b hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-800 text-xs tracking-wider">
                          {module}
                        </td>
                        {Object.values(ACTIONS).map((action) => {
                          const granted = getPermissionStatus(module, action);
                          return (
                            <td key={action} className="px-3 py-3 text-center">
                              <button
                                onClick={() => handlePermissionToggle(module, action)}
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
      )}
    </div>
  );
}
