"use client";

import { useState, useEffect, useMemo } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import {
  GraduationCap,
  Download,
  Upload,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";

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
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const filtered = useMemo(() => {
    return admissions.filter(a => {
      const matchSearch =
        a.studentName.toLowerCase().includes(search.toLowerCase()) ||
        a.cnic.includes(search) ||
        a.email.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "ALL" || a.status === filter;
      return matchSearch && matchFilter;
    });
  }, [admissions, search, filter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedAdmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-5">
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

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">BS Admissions</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage BS program admission applications.</p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center flex-wrap self-end sm:self-auto">
          {/* CSV Import */}
          <label className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 cursor-pointer flex items-center gap-2 shadow-xs">
            <Download className="w-4 h-4 text-blue-600" />
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            Export CSV
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-red-500" />
            Export PDF
          </button>

          {canAdd && (
            <a
              href="/admission"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-semibold transition-all shadow-sm shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Application
            </a>
          )}
        </div>
      </div>

      {/* Alert message */}
      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${msg.type === "success"
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Filters & Search Card */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, CNIC, or email..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200/90 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setFilter("ALL"); setCurrentPage(1); }}
            className={`px-4 py-1.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${filter === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            All
          </button>

          <button
            onClick={() => { setFilter("PENDING"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "PENDING"
              ? "bg-amber-50 text-amber-900 border border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Pending
          </button>

          <button
            onClick={() => { setFilter("APPROVED"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "APPROVED"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Approved
          </button>

          <button
            onClick={() => { setFilter("REJECTED"); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer ${filter === "REJECTED"
              ? "bg-rose-50 text-rose-900 border border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Rejected
          </button>
        </div>

        {/* Counter Block */}
        <div className="flex items-center gap-3 pl-3 sm:border-l sm:border-gray-100">
          {selectedIds.length > 0 && (
            <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
              {selectedIds.length} selected
            </span>
          )}
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 leading-tight">
              {filtered.length} <span className="text-gray-400 font-normal">/ {admissions.length}</span>
            </div>
            <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-medium">Loading applications...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-700">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                      checked={selectedIds.length === paginatedAdmissions.length && paginatedAdmissions.length > 0}
                      onChange={() => toggleAll(paginatedAdmissions.map(a => a.id))}
                    />
                  </th>
                  <th className="py-3.5 px-3 w-8">#</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">CNIC</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Challan Type</th>
                  <th className="py-3.5 px-4">Fee Status</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedAdmissions.map((a, i) => {
                  const rowIndex = (currentPage - 1) * pageSize + i + 1;
                  const isSelected = selectedIds.includes(a.id);
                  const challan = challanMap[a.cnic];

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50/60" : "bg-white"}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-0"
                          checked={isSelected}
                          onChange={() => toggleSelect(a.id)}
                        />
                      </td>
                      <td className="py-3.5 px-3 font-medium text-gray-800">{rowIndex}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="font-bold text-blue-600 hover:text-blue-700 text-left block transition-colors"
                        >
                          {a.studentName}
                        </button>
                        <div className="text-[11px] text-gray-500 mt-0.5">{a.email || "No email"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800 text-[11px]">
                        {a.cnic || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {a.program?.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {a.session || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {challan ? (
                          <a
                            href={`/print/challan/${challan.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            {challan.challanNumber}
                          </a>
                        ) : (
                          <span className="text-gray-500 font-normal">No Challan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-3 py-1 text-[11px] rounded-full bg-blue-50 text-blue-600 font-semibold">
                          {a.bsAdmissionType === "BRIDGING_5TH"
                            ? "Bridging"
                            : a.bsAdmissionType === "MIGRATION"
                              ? `Migration (Sem ${a.migrationSemester ?? "?"})`
                              : "Regular"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {a.status === "PENDING" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                            PENDING
                          </span>
                        )}
                        {a.status === "APPROVED" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800">
                            APPROVED
                          </span>
                        )}
                        {a.status === "REJECTED" && (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-100 text-rose-800">
                            REJECTED
                          </span>
                        )}
                        {a.status === "APPROVED" && a.rollNumber && (
                          <div className="mt-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 inline-block font-mono">
                            🆔 {a.rollNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {new Date(a.createdAt).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {canApprove && a.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleStatus(a.id, "APPROVED")}
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatus(a.id, "REJECTED")}
                                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-gray-400 text-xs">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer & Pagination */}
        <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <div className="relative inline-block">
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === page
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Admission Modal */}
      {editingAdmission && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-gray-900">Update Admission & Student Profile</h2>
            <p className="text-xs text-gray-500">Update details for CNIC: {editForm.cnic}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Student Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.studentName}
                    onChange={e => setEditForm(f => ({ ...f, studentName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Father's Name *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.fatherName}
                    onChange={e => setEditForm(f => ({ ...f, fatherName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Contact Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.contactNumber}
                    onChange={e => setEditForm(f => ({ ...f, contactNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">CNIC Number *</label>
                  <input
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-mono"
                    value={editForm.cnic}
                    onChange={e => setEditForm(f => ({ ...f, cnic: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Session Year Prefix *</label>
                  <input
                    required
                    placeholder="e.g. 2026-2028"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                    value={editForm.session}
                    onChange={e => setEditForm(f => ({ ...f, session: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Admission Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
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
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Migration Semester</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
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
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Program</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                  value={editForm.programId}
                  onChange={e => setEditForm(f => ({ ...f, programId: e.target.value }))}
                >
                  <option value="">-- Select BS Program --</option>
                  {programs.filter((p: any) => p.educationLevel === "BS").map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAdmission(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-all"
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

