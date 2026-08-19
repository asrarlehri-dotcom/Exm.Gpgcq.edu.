"use client";

import { useState, useEffect } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";

type Admission = {
  id: string;
  studentName: string;
  fatherName: string;
  cnic: string;
  contactNumber: string;
  email: string;
  status: string;
  bsAdmissionType?: string | null;
  migrationSemester?: number | null;
  session?: string | null;
  programId?: string | null;
  groupId?: string | null;
  program?: { name: string } | null;
  rollNumber?: string | null;
  createdAt: string;
};

type ChallanStatus = {
  id: string;
  cnic: string;
  status: string;
  challanNumber: string;
  amount: number;
  paidId?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100  text-green-800",
  REJECTED: "bg-red-100    text-red-800",
};

export default function BsAdmissionsPage() {
  const { can } = usePermissions();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [challanMap, setChallanMap] = useState<Record<string, ChallanStatus>>({});
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (ids: string[]) =>
    setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  // Edit form states
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [editForm, setEditForm] = useState({
    studentName: "",
    fatherName: "",
    email: "",
    contactNumber: "",
    cnic: "",
    session: "",
    bsAdmissionType: "",
    programId: "",
    migrationSemester: ""
  });
  const [updating, setUpdating] = useState(false);

  const canAdd = can(MODULES.BS_ADMISSIONS, ACTIONS.ADD);
  const canApprove = can(MODULES.BS_ADMISSIONS, ACTIONS.APPROVE);

  useEffect(() => {
    fetchAdmissions();
    fetchChallans();
    fetchPrograms();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    const res = await fetch("/api/admissions?educationLevel=BS");
    if (res.ok) setAdmissions(await res.json());
    setLoading(false);
  };

  const fetchChallans = async () => {
    const res = await fetch("/api/challans?educationLevel=BS");
    if (res.ok) {
      const data: any[] = await res.json();
      // Keep the latest challan per CNIC
      const map: Record<string, ChallanStatus> = {};
      data.forEach(c => {
        if (!map[c.cnic] || c.status === "PAID") {
          map[c.cnic] = { id: c.id, cnic: c.cnic, status: c.status, challanNumber: c.challanNumber, amount: c.amount, paidId: c.paidId };
        }
      });
      setChallanMap(map);
    }
  };

  const fetchPrograms = async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `Application ${status.toLowerCase()}` });
      fetchAdmissions();
    } else {
      setMsg({ type: "error", text: "Update failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admission application?")) return;
    const res = await fetch(`/api/admissions/${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Application deleted successfully." });
      fetchAdmissions();
      fetchChallans();
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error || "Failed to delete application" });
    }
  };

  const handleOpenEdit = (a: Admission) => {
    setEditingAdmission(a);
    setEditForm({
      studentName: a.studentName || "",
      fatherName: a.fatherName || "",
      email: a.email || "",
      contactNumber: a.contactNumber || "",
      cnic: a.cnic || "",
      session: a.session || "",
      bsAdmissionType: a.bsAdmissionType || "REGULAR",
      programId: a.programId || "",
      migrationSemester: String(a.migrationSemester || "")
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmission) return;
    setUpdating(true);
    const res = await fetch(`/api/admissions/${editingAdmission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        migrationSemester: editForm.bsAdmissionType === "MIGRATION" && editForm.migrationSemester ? Number(editForm.migrationSemester) : null
      })
    });
    if (res.ok) {
      setMsg({ type: "success", text: "Admission details updated successfully." });
      setEditingAdmission(null);
      fetchAdmissions();
      fetchChallans();
    } else {
      const data = await res.json();
      setMsg({ type: "error", text: data.error || "Failed to save details" });
    }
    setUpdating(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setMsg({ type: "error", text: "Invalid CSV file format." });
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));

      const parsedAdmissions = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        parsedAdmissions.push(row);
      }

      let successCount = 0;
      let failCount = 0;
      for (const item of parsedAdmissions) {
        const prog = programs.find(p => p.name.toLowerCase() === item.programName?.toLowerCase() || p.code?.toLowerCase() === item.programCode?.toLowerCase());
        const payload = {
          studentName: item.studentName || item.name,
          fatherName: item.fatherName,
          cnic: item.cnic,
          dateOfBirth: item.dateOfBirth,
          contactNumber: item.contactNumber || item.contact,
          email: item.email,
          residentAddress: item.residentAddress || item.address,
          educationLevel: "BS",
          programId: prog ? prog.id : (item.programId || null),
          bsAdmissionType: item.bsAdmissionType || "REGULAR",
          session: item.session || "2026-2030",
          gender: item.gender || "MALE"
        };

        try {
          const res = await fetch("/api/admissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) successCount++;
          else failCount++;
        } catch (err) {
          failCount++;
        }
      }
      setMsg({ type: "success", text: `Imported admissions: ${successCount} successful, ${failCount} failed.` });
      fetchAdmissions();
      fetchChallans();
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const headers = ["Student Name", "Father Name", "CNIC", "Contact", "Email", "Program", "Session", "Status", "Challan No", "Fee Status"];
    const rows = filtered.map(a => [
      a.studentName,
      a.fatherName,
      a.cnic || "N/A",
      a.contactNumber,
      a.email || "N/A",
      a.program?.name || "N/A",
      a.session || "N/A",
      a.status,
      challanMap[a.cnic]?.challanNumber || "N/A",
      challanMap[a.cnic]?.status || "N/A"
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admissions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const filtered = admissions.filter(a => {
    const matchSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.cnic.includes(search) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Print Page adjustments */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          aside, .sidebar, .print-hide, .no-print, button, label, input, select, header {
            display: none !important;
          }
          html, body, div.flex.h-screen, main {
            height: auto !important;
            overflow: visible !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}} />

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BS Admissions</h1>
          <p className="text-gray-500 mt-1">Manage BS program admission applications.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* CSV Import */}
          <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors cursor-pointer border flex items-center gap-1">
            📥 Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          {/* CSV Export */}
          <button onClick={handleExportCSV} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1">
            📤 Export CSV
          </button>
          {/* PDF Export */}
          <button onClick={handleExportPDF} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1">
            🖨️ Export PDF
          </button>
          {canAdd && (
            <a
              href="/admission"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              + New Application
            </a>
          )}
        </div>
      </div>

      {/* Alert message */}
      {msg.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
          }`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 print:hidden">
        <input
          type="text"
          placeholder="🔍 Search name, CNIC, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === s
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} / {admissions.length}
        </span>
        {selectedIds.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full self-center">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={() => toggleAll(filtered.map(a => a.id))} />
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Student</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">CNIC</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Program</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Session</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Challan Type</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Fee Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className={`border-b hover:bg-gray-50 transition-colors ${selectedIds.includes(a.id) ? "bg-blue-50/60" : ""}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)} />
                    </td>
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className="font-medium text-blue-600 hover:underline text-left block"
                      >
                        {a.studentName}
                      </button>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{a.cnic}</td>
                    <td className="px-5 py-3 text-gray-600">{a.program?.name || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{a.session || "—"}</td>
                    <td className="px-5 py-3">
                      {/* Fee status badge with print link (matched by CNIC) */}
                      {challanMap[a.cnic] ? (
                        <a
                          href={`/print/challan/${challanMap[a.cnic].id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-80 block cursor-pointer"
                          title="Click to print challan"
                        >
                          <span className={`px-2 py-1 text-xs font-bold rounded-full border ${challanMap[a.cnic].status === "PAID" ? "bg-green-100 text-green-800 border-green-200" :
                            challanMap[a.cnic].status === "REJECTED" ? "bg-red-100 text-red-800 border-red-200" :
                              "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}>
                            {challanMap[a.cnic].status === "PAID" ? "💚 Paid" :
                              challanMap[a.cnic].status === "REJECTED" ? "❌ Rejected" : "⏳ Pending"}
                          </span>
                          <div className="text-[10px] text-blue-600 underline mt-0.5">{challanMap[a.cnic].challanNumber}</div>
                          {challanMap[a.cnic].status === "PAID" && challanMap[a.cnic].paidId && (
                            <div className="text-[9px] font-bold text-green-700 mt-0.5 bg-green-50 px-1 py-0.5 border border-green-100 rounded inline-block">
                              ID: {challanMap[a.cnic].paidId}
                            </div>
                          )}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">No Challan</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {a.bsAdmissionType ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-medium">
                          {a.bsAdmissionType === "BRIDGING_5TH"
                            ? "5th Sem / Bridging"
                            : a.bsAdmissionType === "MIGRATION"
                              ? `Migration → Sem ${a.migrationSemester ?? "?"}`
                              : "Regular"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[a.status] || "bg-gray-100"}`}>
                        {a.status}
                      </span>
                      {a.status === "APPROVED" && a.rollNumber && (
                        <div className="mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 inline-block font-mono">
                          🆔 {a.rollNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2 items-center flex-wrap">
                        {canApprove && a.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleStatus(a.id, "APPROVED")}
                              className="text-green-600 hover:underline text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatus(a.id, "REJECTED")}
                              className="text-red-500 hover:underline text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {a.status === "APPROVED" && (
                          <span className="text-xs text-green-600 font-bold">Registered ✅</span>
                        )}
                        {a.status === "REJECTED" && (
                          <span className="text-xs text-red-500 font-medium">Rejected ❌</span>
                        )}
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-red-600 hover:text-red-800 hover:underline text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Admission Modal */}
      {editingAdmission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Update Admission & Student Profile</h2>
            <p className="text-xs text-gray-500">Update details for CNIC: {editForm.cnic}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Student Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.studentName}
                    onChange={e => setEditForm(f => ({ ...f, studentName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Father's Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.fatherName}
                    onChange={e => setEditForm(f => ({ ...f, fatherName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.contactNumber}
                    onChange={e => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">CNIC Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 font-mono"
                    value={editForm.cnic}
                    onChange={e => setEditForm(f => ({ ...f, cnic: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Session Year Prefix *</label>
                  <input
                    required
                    placeholder="e.g. 2026-2028"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.session}
                    onChange={e => setEditForm(f => ({ ...f, session: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Admission Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                    value={editForm.bsAdmissionType}
                    onChange={e => setEditForm(f => ({ ...f, bsAdmissionType: e.target.value }))}
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="BRIDGING_5TH">Bridging 5th</option>
                    <option value="MIGRATION">Migration</option>
                  </select>
                </div>
                {editForm.bsAdmissionType === "MIGRATION" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Migration Semester</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                      value={editForm.migrationSemester}
                      onChange={e => setEditForm(f => ({ ...f, migrationSemester: e.target.value }))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Program</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  value={editForm.programId}
                  onChange={e => setEditForm(f => ({ ...f, programId: e.target.value }))}
                >
                  <option value="">-- Select BS Program --</option>
                  {programs.filter((p: any) => p.educationLevel === "BS").map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAdmission(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
