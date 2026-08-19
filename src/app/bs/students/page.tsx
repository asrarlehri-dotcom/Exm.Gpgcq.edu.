"use client";

import { useState, useEffect } from "react";

type StudentRecord = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  rollNumber: string;
  registrationNumber?: string;
  fatherName?: string;
  educationLevel: string;
  session?: string;
  shift?: string;
  currentSemester?: number | null;
  bsAdmissionType?: string | null;
  isActive: boolean;
  programId?: string | null;
  program?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  cnic?: string;
  contactNumber?: string;
  residentAddress?: string;
  statuses?: any[];
};

const INPUT_STYLE = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50";
const BTN_SECONDARY = "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border border-gray-300";

export default function BSStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notifications
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [filterShift, setFilterShift] = useState("ALL");
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterProgram, setFilterProgram] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Selection / Checkbox state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<StudentRecord | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);

  // Form State for Adding New Student
  const blankForm = {
    name: "",
    fatherName: "",
    email: "",
    password: "",
    rollNumber: "",
    registrationNumber: "",
    educationLevel: "BS",
    programId: "",
    session: "2024-2028",
    shift: "Morning",
    currentSemester: "1",
    bsAdmissionType: "REGULAR",
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, setRes] = await Promise.all([
        fetch("/api/students?educationLevel=BS"),
        fetch("/api/programs"),
        fetch("/api/settings"),
      ]);

      if (sRes.ok) setStudents(await sRes.json());
      if (pRes.ok) setPrograms(await pRes.json());
      if (setRes.ok) {
        const data = await setRes.json();
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessionOptions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessionOptions(DEFAULT_ALL_SESSIONS);
        }
      }
    } catch {
      setError("Failed to load BS student records.");
    }
    setLoading(false);
  };

  // Helper to derive academic status with exact badges:
  // 🏆 Promoted, ❄️ Freeze Status, 🚫 Dropout Status, 🚪 Quit Status, ➡️ Migration In, ⬅️ Migration Out
  const getStudentStatusObj = (s: StudentRecord) => {
    if (s.isActive === false) {
      return { key: "DEACTIVATED", badge: "🔴 Deactivated", cls: "bg-red-100 text-red-800 border-red-300 line-through" };
    }
    
    if (s.statuses && s.statuses.length > 0) {
      const latest = s.statuses[s.statuses.length - 1];
      const type = latest.statusType?.toUpperCase();
      if (type === "FREEZE") return { key: "FREEZE", badge: "❄️ Freeze Status", cls: "bg-cyan-100 text-cyan-800 border-cyan-300" };
      if (type === "DROPOUT") return { key: "DROPOUT", badge: "🚫 Dropout Status", cls: "bg-red-100 text-red-800 border-red-300" };
      if (type === "QUIT" || type === "ADP") return { key: "QUIT", badge: "🚪 Quit / ADP", cls: "bg-gray-100 text-gray-800 border-gray-300" };
      if (type === "MIGRATION_IN" || (s.bsAdmissionType === "MIGRATION" && type !== "MIGRATION_OUT")) {
        return { key: "MIGRATION_IN", badge: "➡️ Migration In", cls: "bg-purple-100 text-purple-800 border-purple-300" };
      }
      if (type === "MIGRATION_OUT" || type === "MIGRATION") {
        return { key: "MIGRATION_OUT", badge: "⬅️ Migration Out", cls: "bg-orange-100 text-orange-800 border-orange-300" };
      }
    }

    if (s.bsAdmissionType === "MIGRATION") {
      return { key: "MIGRATION_IN", badge: "➡️ Migration In", cls: "bg-purple-100 text-purple-800 border-purple-300" };
    }

    if (!s.isActive) {
      return { key: "INACTIVE", badge: "🔴 Inactive", cls: "bg-gray-100 text-gray-700 border-gray-300" };
    }

    return { key: "PROMOTED", badge: `🏆 Promoted (Sem ${s.currentSemester || 1})`, cls: "bg-green-100 text-green-800 border-green-300" };
  };

  // Filtered Students List
  const filteredStudents = students.filter((s) => {
    // 1. Text search across name, father name, roll number, registration number, email
    const q = search.toLowerCase().trim();
    if (q) {
      const nameMatch = s.user?.name?.toLowerCase().includes(q);
      const emailMatch = s.user?.email?.toLowerCase().includes(q);
      const fatherMatch = s.fatherName?.toLowerCase().includes(q);
      const rollMatch = s.rollNumber?.toLowerCase().includes(q);
      const regMatch = s.registrationNumber?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !fatherMatch && !rollMatch && !regMatch) return false;
    }

    // 2. Shift filter (Morning, Evening, Replica)
    if (filterShift !== "ALL") {
      const studentShift = s.shift || "Morning";
      if (studentShift.toLowerCase() !== filterShift.toLowerCase()) return false;
    }

    // 3. Session filter
    if (filterSession !== "ALL") {
      const sSession = s.session || "2024-2028";
      if (sSession !== filterSession) return false;
    }

    // 4. Program filter
    if (filterProgram !== "ALL" && s.programId !== filterProgram) return false;

    // 5. Semester filter
    if (filterSemester !== "ALL" && String(s.currentSemester) !== filterSemester) return false;

    // 6. Status filter (Promoted, Freeze, Dropout, Quit, Migration In, Migration Out)
    if (filterStatus !== "ALL") {
      const stObj = getStudentStatusObj(s);
      if (filterStatus === "PROMOTED" && stObj.key !== "PROMOTED") return false;
      if (filterStatus === "FREEZE" && stObj.key !== "FREEZE") return false;
      if (filterStatus === "DROPOUT" && stObj.key !== "DROPOUT") return false;
      if (filterStatus === "QUIT" && stObj.key !== "QUIT") return false;
      if (filterStatus === "MIGRATION_IN" && stObj.key !== "MIGRATION_IN") return false;
      if (filterStatus === "MIGRATION_OUT" && stObj.key !== "MIGRATION_OUT") return false;
    }

    return true;
  });

  // Bulk Selection Handlers
  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.includes(s.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Action: Add New Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`BS Student "${data.user?.name || form.name}" registered successfully!`);
        setForm(blankForm);
        setShowAddModal(false);
        fetchAll();
      } else {
        setError(data.error || "Failed to register student.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  // Action: Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: editingStudent.rollNumber,
          programId: editingStudent.programId,
          currentSemester: editingStudent.currentSemester,
          isActive: editingStudent.isActive,
        }),
      });
      if (res.ok) {
        setSuccess(`Student "${editingStudent.user?.name}" updated successfully!`);
        setEditingStudent(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Update failed.");
      }
    } catch {
      setError("Failed to update student details.");
    }
    setSaving(false);
  };

  // Action: Delete Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess(`Student record for "${deletingStudent.user?.name}" deleted successfully!`);
        setDeletingStudent(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Delete failed.");
      }
    } catch {
      setError("Failed to delete student record.");
    }
    setSaving(false);
  };

  // Action: Export CSV / Excel
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No student records available to export.");
      return;
    }

    const headers = [
      "#",
      "Full Name",
      "Father Name",
      "Email",
      "Roll Number",
      "Registration Number",
      "Program",
      "Session",
      "Semester",
      "Shift",
      "Status",
    ];

    const rows = filteredStudents.map((s, index) => [
      index + 1,
      `"${s.user?.name || ""}"`,
      `"${s.fatherName || "N/A"}"`,
      `"${s.user?.email || ""}"`,
      `"${s.rollNumber || ""}"`,
      `"${s.registrationNumber || `REG-${s.rollNumber}`}"`,
      `"${s.program?.name || "BS"}"`,
      `"${s.session || "2024-2028"}"`,
      `"Semester ${s.currentSemester || 1}"`,
      `"${s.shift || "Morning"}"`,
      `"${getStudentStatusObj(s).badge}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BS_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Print List
  const handlePrintList = () => {
    window.print();
  };

  const bsPrograms = programs.filter((p) => p.educationLevel === "BS");

  return (
    <div className="space-y-6">
      {/* Top Header & Main Actions Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">🎓 BS Student Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-700 rounded-full">
              BS Academic Branch
            </span>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Manage student registrations, academic shifts, batches, and examination status records.
          </p>
        </div>

        {/* Top Control Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className={BTN_SECONDARY}
            title="Export list to CSV / Excel file"
          >
            <span className="text-base">📊</span>
            <span>Export CSV</span>
          </button>

          {/* Print List Button */}
          <button
            onClick={handlePrintList}
            className={BTN_SECONDARY}
            title="Print formatted student list"
          >
            <span className="text-base">🖨️</span>
            <span>Print List</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className={BTN_PRIMARY}
          >
            <span className="text-lg font-bold">+</span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold border border-green-200">{success}</div>}

      {/* Filter Bar Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          {/* Search Bar with Updated Placeholder */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Search Student
            </label>
            <input
              type="text"
              className={INPUT_STYLE}
              placeholder="Search name, father name, roll no, reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Shift Filter (Morning, Evening, Replica) */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Shift
            </label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Replica">Replica</option>
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Session
            </label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Sessions</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Program
            </label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Programs</option>
              {bsPrograms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Semester
            </label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Statuses</option>
              <option value="PROMOTED">🏆 Promoted</option>
              <option value="FREEZE">❄️ Freeze Status</option>
              <option value="DROPOUT">🚫 Dropout Status</option>
              <option value="QUIT">🚪 Quit / ADP</option>
              <option value="MIGRATION_IN">➡️ Migration In</option>
              <option value="MIGRATION_OUT">⬅️ Migration Out</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Bulk Selection Indicator */}
        <div className="flex flex-wrap justify-between items-center text-sm text-gray-600 pt-3 border-t">
          <div className="flex items-center gap-3">
            <span>Showing <strong className="text-gray-900 font-bold">{filteredStudents.length}</strong> matching BS student(s)</span>
            {selectedIds.length > 0 && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-full border border-indigo-200">
                {selectedIds.length} student(s) selected
              </span>
            )}
          </div>

          {(filterShift !== "ALL" || filterSession !== "ALL" || filterProgram !== "ALL" || filterSemester !== "ALL" || filterStatus !== "ALL" || search !== "") && (
            <button
              onClick={() => {
                setFilterShift("ALL");
                setFilterSession("ALL");
                setFilterProgram("ALL");
                setFilterSemester("ALL");
                setFilterStatus("ALL");
                setSearch("");
              }}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-medium">⏳ Loading student records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* Column 1: Checkbox Column */}
                  <th className="px-4 py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                      title="Select All Students"
                    />
                  </th>
                  {/* Column 2: # */}
                  <th className="px-3 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center w-12">#</th>
                  {/* Column 3: Student Info */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Student Info</th>
                  {/* Column 4: Roll / Reg No */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Roll / Reg No</th>
                  {/* Column 5: Program */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Program</th>
                  {/* Column 6: Session */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Session</th>
                  {/* Column 7: Semester */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Semester</th>
                  {/* Column 8: Status */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Status</th>
                  {/* Column 9: Actions */}
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-gray-700">No BS students match your search or filter criteria.</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting filters or searching with different keywords.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => {
                    const stObj = getStudentStatusObj(s);
                    const isSelected = selectedIds.includes(s.id);

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isSelected ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Checkbox Column */}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(s.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                          />
                        </td>

                        {/* # Index Column */}
                        <td className="px-3 py-4 text-center font-medium text-gray-400">{index + 1}</td>

                        {/* Student Info (Name, Father Name, Email) */}
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900 text-sm">{s.user?.name || "Student"}</div>
                          <div className="text-xs text-gray-500 font-medium">
                            S/O: {s.fatherName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-400">{s.user?.email || "—"}</div>
                        </td>

                        {/* Roll / Reg No */}
                        <td className="px-4 py-4">
                          <div className="font-mono text-sm font-bold text-gray-800">{s.rollNumber}</div>
                          <div className="text-xs font-mono text-gray-500">
                            {s.registrationNumber || `REG-${s.rollNumber}`}
                          </div>
                        </td>

                        {/* Program */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-800 text-xs">
                            {s.program?.name || "BS Program"}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Shift: <span className="font-medium text-gray-600">{s.shift || "Morning"}</span>
                          </div>
                        </td>

                        {/* Session (Visually Visible Batch) */}
                        <td className="px-4 py-4 text-center">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                            {s.session || "2024-2028"}
                          </span>
                        </td>

                        {/* Semester */}
                        <td className="px-4 py-4 text-center font-extrabold text-blue-700">
                          Semester {s.currentSemester || 1}
                        </td>

                        {/* Status (Promoted, Freeze, Dropout, Quit, Migration In, Migration Out) */}
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${stObj.cls}`}>
                            {stObj.badge}
                          </span>
                        </td>

                        {/* Actions Overhaul: Sleek Icon Action Triggers */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Eye Icon: View Profile */}
                            <button
                              onClick={() => setViewingStudent(s)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-sm"
                              title="View Full Profile"
                            >
                              👁️
                            </button>

                            {/* Edit Icon: Edit Details */}
                            <button
                              onClick={() => setEditingStudent(s)}
                              className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors shadow-sm"
                              title="Edit Details"
                            >
                              ✏️
                            </button>

                            {/* Trash Icon: Deactivate Record */}
                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shadow-sm"
                              title="Deactivate Record"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: VIEW PROFILE MODAL */}
      {/* ---------------------------------------------------- */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingStudent.user?.name}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Roll: {viewingStudent.rollNumber} | Reg: {viewingStudent.registrationNumber || `REG-${viewingStudent.rollNumber}`}
                </p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Father Name</span>
                <span className="font-semibold text-gray-800">{viewingStudent.fatherName || "N/A"}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Email Address</span>
                <span className="font-semibold text-gray-800 text-xs truncate block">{viewingStudent.user?.email || "N/A"}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Degree Program</span>
                <span className="font-semibold text-gray-800">{viewingStudent.program?.name || "BS"}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Shift / Batch</span>
                <span className="font-semibold text-gray-800">
                  {viewingStudent.shift || "Morning"} ({viewingStudent.session || "2024-2028"})
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Current Semester</span>
                <span className="font-bold text-blue-600">Semester {viewingStudent.currentSemester || 1}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Academic Status</span>
                <span className="font-bold text-gray-800">{getStudentStatusObj(viewingStudent).badge}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: EDIT STUDENT DETAILS MODAL */}
      {/* ---------------------------------------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Edit Student Details</h2>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  className={INPUT_STYLE}
                  value={editingStudent.rollNumber}
                  onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Degree Program</label>
                <select
                  className={INPUT_STYLE}
                  value={editingStudent.programId || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, programId: e.target.value })}
                >
                  <option value="">-- Select Program --</option>
                  {bsPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Semester</label>
                <select
                  className={INPUT_STYLE}
                  value={editingStudent.currentSemester || 1}
                  onChange={(e) => setEditingStudent({ ...editingStudent, currentSemester: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingStudent.isActive}
                  onChange={(e) => setEditingStudent({ ...editingStudent, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-semibold text-gray-700">
                  Student Account Active
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 ${BTN_PRIMARY}`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className={`flex-1 ${BTN_SECONDARY}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------- */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 text-center border border-red-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deactivate Student Record?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to deactivate student{" "}
                <strong className="text-gray-900">"{deletingStudent.user?.name}"</strong> ({deletingStudent.rollNumber})?
              </p>
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100 font-medium">
              ⚠️ Note: This action will disable the student's access. The record is kept for historical constraints.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? "Deactivating..." : "Confirm Deactivate"}
              </button>
              <button
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: ADD NEW STUDENT MODAL */}
      {/* ---------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Register New BS Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Ali Hassan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father Name</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Muhammad Hassan"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Roll Number *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="24-BSCS-001"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registration No.</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="REG-2024-CS-001"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    className={INPUT_STYLE}
                    placeholder="student@college.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password *</label>
                  <input
                    required
                    type="password"
                    className={INPUT_STYLE}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shift *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Replica">Replica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Session *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.session}
                    onChange={(e) => setForm({ ...form, session: e.target.value })}
                  >
                    {sessionOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.currentSemester}
                    onChange={(e) => setForm({ ...form, currentSemester: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BS Admission Type</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.bsAdmissionType}
                    onChange={(e) => setForm({ ...form, bsAdmissionType: e.target.value })}
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="BRIDGING_5TH">Bridging 5th</option>
                    <option value="MIGRATION">Migration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program *</label>
                <select
                  required
                  className={INPUT_STYLE}
                  value={form.programId}
                  onChange={(e) => setForm({ ...form, programId: e.target.value })}
                >
                  <option value="">-- Select BS Program --</option>
                  {bsPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 ${BTN_PRIMARY}`}
                >
                  {saving ? "Registering..." : "Register Student"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 ${BTN_SECONDARY}`}
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
