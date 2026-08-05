"use client";

import { useState, useEffect } from "react";

type FeeSetting = {
  id: string;
  key: string;
  label: string;
  amount: number;
  isLocked: boolean;
  description: string | null;
  category: string | null;
};

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  BS:           { label: "BS Program",    color: "bg-blue-50 border-blue-200",   icon: "🎓" },
  INTERMEDIATE: { label: "Intermediate",  color: "bg-amber-50 border-amber-200", icon: "🏫" },
  EXAM:         { label: "Examination",   color: "bg-purple-50 border-purple-200",icon: "📝" },
  OTHER:        { label: "Other",         color: "bg-gray-50 border-gray-200",   icon: "💼" },
};

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

export default function FeeSettingsPage() {
  const [fees, setFees] = useState<FeeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  // Global settings state
  const [bankAccount, setBankAccount] = useState("");
  const [sequenceStart, setSequenceStart] = useState("");
  const [rollPattern, setRollPattern] = useState("");
  const [rollSequence, setRollSequence] = useState("");
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchFees();
    fetchSettings();
  }, []);

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

  const fetchFees = async () => {
    setLoading(true);
    const res = await fetch("/api/fee-settings");
    if (res.ok) setFees(await res.json());
    setLoading(false);
  };

  const startEdit = (f: FeeSetting) => {
    setEditingId(f.id);
    setEditAmount(String(f.amount));
    setEditDesc(f.description || "");
    setMsg({ type: "", text: "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditDesc("");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const res = await fetch("/api/fee-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount: Number(editAmount), description: editDesc }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "success", text: "Fee updated successfully." });
      cancelEdit();
      fetchFees();
    } else {
      setMsg({ type: "error", text: data.error || "Failed to save." });
    }
    setSaving(false);
  };

  const toggleLock = async (f: FeeSetting) => {
    const res = await fetch("/api/fee-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: f.id, isLocked: !f.isLocked }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: f.isLocked ? `"${f.label}" unlocked.` : `"${f.label}" locked.` });
      fetchFees();
    }
  };

  // Group by category
  const grouped = fees.reduce<Record<string, FeeSetting[]>>((acc, f) => {
    const cat = f.category || "OTHER";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-gray-400">Loading fee settings...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Fee Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure and lock fee amounts used for challan generation. Locked fees cannot be changed.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium">
            🔓 Unlocked = Editable
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
            🔒 Locked = Fixed
          </span>
        </div>
      </div>

      {/* Global Challan & Roll Number Configuration Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
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
                onChange={e => setBankAccount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Challan Number (Sequence)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold"
                value={sequenceStart}
                onChange={e => setSequenceStart(e.target.value)}
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
                onChange={e => setRollPattern(e.target.value)}
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
                onChange={e => setRollSequence(e.target.value)}
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

      {/* Alert */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          msg.type === "success"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Fee Cards by Category */}
      {Object.entries(grouped).map(([cat, catFees]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.OTHER;
        return (
          <div key={cat} className={`rounded-xl border ${meta.color} overflow-hidden`}>
            {/* Category Header */}
            <div className="px-5 py-3 flex items-center gap-2 border-b border-inherit">
              <span className="text-lg">{meta.icon}</span>
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{meta.label}</h2>
              <span className="ml-auto text-xs text-gray-500">{catFees.length} fee type{catFees.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Fee Rows */}
            <div className="divide-y divide-gray-100 bg-white">
              {catFees.map((f) => (
                <div key={f.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  {/* Lock icon */}
                  <button
                    onClick={() => toggleLock(f)}
                    title={f.isLocked ? "Click to unlock" : "Click to lock"}
                    className={`text-xl transition-transform hover:scale-110 ${f.isLocked ? "text-red-500" : "text-gray-300 hover:text-amber-500"}`}
                  >
                    {f.isLocked ? "🔒" : "🔓"}
                  </button>

                  {/* Label + description */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-semibold text-gray-800 text-sm">{f.label}</div>
                    {f.description && (
                      <div className="text-xs text-gray-400 mt-0.5">{f.description}</div>
                    )}
                  </div>

                  {/* Amount display / edit */}
                  {editingId === f.id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center border border-blue-300 rounded-lg overflow-hidden shadow-sm">
                        <span className="px-3 py-2 bg-blue-50 text-blue-700 font-bold text-sm border-r border-blue-200">Rs.</span>
                        <input
                          type="number"
                          min={0}
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-28 px-3 py-2 text-sm font-bold outline-none"
                          autoFocus
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-xs w-48 outline-none"
                      />
                      <button
                        onClick={() => saveEdit(f.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Amount badge */}
                      <div className="text-right">
                        <div className={`text-lg font-black ${f.isLocked ? "text-red-600" : "text-gray-900"}`}>
                          Rs. {f.amount.toLocaleString()}/-
                        </div>
                        <div className="text-[10px] text-gray-400 italic capitalize">
                          ({toWords(f.amount)})
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => startEdit(f)}
                        disabled={f.isLocked}
                        title={f.isLocked ? "Unlock to edit" : "Edit amount"}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          f.isLocked
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        }`}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Help note */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-500">
        💡 <strong>Tip:</strong> Lock a fee once confirmed to prevent accidental changes. Locked fees will be used automatically when generating challans. Unlock at any time to update.
      </div>
    </div>
  );
}
