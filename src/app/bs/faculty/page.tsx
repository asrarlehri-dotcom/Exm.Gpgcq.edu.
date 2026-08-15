"use client";

import { useState, useEffect } from "react";

type FacultyRecord = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  fatherName?: string | null;
  designation?: string | null;
  qualification?: string | null;
  contactNumber?: string | null;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  educationLevel?: string | null;
  isActive: boolean;
  courses?: any[];
};

const INPUT_STYLE = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50";
const BTN_SECONDARY = "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border border-gray-300";

// Helper to auto-generate faculty email from name
const generateEmailFromName = (fullName: string, domain: string) => {
  if (!fullName) return "";
  // Strip common titles like Dr., Prof., Engr., Mr., Ms.
  let cleaned = fullName.replace(/^(dr|prof|engr|mr|ms|mrs)\.?\s+/i, "");
  // Replace spaces and special characters with dots
  cleaned = cleaned.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
  cleaned = cleaned.replace(/^\.|\.$/g, "");
  return cleaned ? `${cleaned}${domain}` : "";
};

export default function BSFacultyPage() {
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System Settings Defaults
  const [defaultPassword, setDefaultPassword] = useState("gpgcq123");
  const [emailDomain, setEmailDomain] = useState("@gpgcquetta.edu.pk");

  // Alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters State
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterDesignation, setFilterDesignation] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingFaculty, setViewingFaculty] = useState<FacultyRecord | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<FacultyRecord | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<FacultyRecord | null>(null);

  // Form State for New Faculty Registration
  const blankForm = {
    name: "",
    fatherName: "",
    email: "",
    password: "gpgcq123",
    designation: "Assistant Professor",
    qualification: "Ph.D. Computer Science",
    contactNumber: "",
    departmentId: "",
    educationLevel: "BOTH",
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, dRes, sRes] = await Promise.all([
        fetch("/api/faculty"),
        fetch("/api/departments"),
        fetch("/api/settings"),
      ]);

      if (fRes.ok) setFacultyList(await fRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        const pwd = sData.DEFAULT_FACULTY_PASSWORD || "gpgcq123";
        const dom = sData.FACULTY_EMAIL_DOMAIN || "@gpgcquetta.edu.pk";
        setDefaultPassword(pwd);
        setEmailDomain(dom);
        setForm((prev) => ({ ...prev, password: prev.password || pwd }));
      }
    } catch {
      setError("Failed to load faculty records.");
    }
    setLoading(false);
  };

  // Auto-generate email on name change
  const handleNameChange = (nameVal: string) => {
    const autoEmail = generateEmailFromName(nameVal, emailDomain);
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      email: autoEmail,
    }));
  };

  // Filtered List
  const filteredFaculty = facultyList.filter((f) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const nameMatch = f.user?.name?.toLowerCase().includes(q);
      const emailMatch = f.user?.email?.toLowerCase().includes(q);
      const fatherMatch = f.fatherName?.toLowerCase().includes(q);
      const desigMatch = f.designation?.toLowerCase().includes(q);
      const qualMatch = f.qualification?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !fatherMatch && !desigMatch && !qualMatch) return false;
    }

    if (filterDept !== "ALL" && f.departmentId !== filterDept) return false;

    if (filterDesignation !== "ALL") {
      if (f.designation?.toLowerCase() !== filterDesignation.toLowerCase()) return false;
    }

    return true;
  });

  // Action: Add Faculty Member
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Faculty member "${data.user?.name || form.name}" registered successfully!`);
        setForm({ ...blankForm, password: defaultPassword });
        setShowAddModal(false);
        fetchAll();
      } else {
        setError(data.error || "Failed to register faculty.");
      }
    } catch {
      setError("Server connection failed.");
    }
    setSaving(false);
  };

  // Action: Edit Faculty Details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/faculty/${editingFaculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFaculty.user?.name,
          fatherName: editingFaculty.fatherName,
          designation: editingFaculty.designation,
          qualification: editingFaculty.qualification,
          contactNumber: editingFaculty.contactNumber,
          departmentId: editingFaculty.departmentId,
          educationLevel: editingFaculty.educationLevel,
          isActive: editingFaculty.isActive,
        }),
      });

      if (res.ok) {
        setSuccess(`Faculty details for "${editingFaculty.user?.name}" updated successfully!`);
        setEditingFaculty(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Update failed.");
      }
    } catch {
      setError("Failed to update faculty member.");
    }
    setSaving(false);
  };

  // Action: Toggle Active Status
  const handleToggleActive = async (f: FacultyRecord) => {
    try {
      const res = await fetch(`/api/faculty/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      if (res.ok) fetchAll();
    } catch {
      alert("Failed to toggle status.");
    }
  };

  // Action: Delete Faculty Member
  const handleConfirmDelete = async () => {
    if (!deletingFaculty) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/faculty/${deletingFaculty.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess(`Faculty member "${deletingFaculty.user?.name}" deleted successfully.`);
        setDeletingFaculty(null);
        fetchAll();
      } else {
        const d = await res.json();
        setError(d.error || "Delete failed.");
      }
    } catch {
      setError("Failed to delete faculty member.");
    }
    setSaving(false);
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    if (filteredFaculty.length === 0) {
      alert("No faculty records available to export.");
      return;
    }

    const headers = [
      "#",
      "Faculty Name",
      "Father Name",
      "Designation",
      "Qualification",
      "Department",
      "Email Address",
      "Contact Number",
      "Status",
    ];

    const rows = filteredFaculty.map((f, i) => [
      i + 1,
      `"${f.user?.name || ""}"`,
      `"${f.fatherName || "N/A"}"`,
      `"${f.designation || "Lecturer"}"`,
      `"${f.qualification || "M.Phil"}"`,
      `"${f.department?.name || "Unassigned"}"`,
      `"${f.user?.email || ""}"`,
      `"${f.contactNumber || "N/A"}"`,
      `"${f.isActive ? "Active" : "Inactive"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BS_Faculty_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Main Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 BS Faculty Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-700 rounded-full">
              Academic Teaching Staff
            </span>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Register, edit, and assign faculty members, designations, qualifications, and department allocations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExportCSV} className={BTN_SECONDARY} title="Export faculty list to CSV">
            <span className="text-base">📊</span>
            <span>Export CSV</span>
          </button>

          <button onClick={() => window.print()} className={BTN_SECONDARY} title="Print faculty list">
            <span className="text-base">🖨️</span>
            <span>Print List</span>
          </button>

          <button onClick={() => {
            setForm({ ...blankForm, password: defaultPassword });
            setShowAddModal(true);
          }} className={BTN_PRIMARY}>
            <span className="text-lg font-bold">+</span>
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold border border-green-200">{success}</div>}

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Search Faculty
            </label>
            <input
              type="text"
              className={INPUT_STYLE}
              placeholder="Search by name, father name, designation, qualification, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Department
            </label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
              Designation
            </label>
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className={INPUT_STYLE}
            >
              <option value="ALL">All Designations</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Visiting Faculty">Visiting Faculty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-medium">⏳ Loading faculty records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center w-12">#</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Faculty Info</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Designation & Qualification</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Assigned Courses</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3.5 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-gray-700">No faculty members found matching criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((f, i) => (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 text-center font-medium text-gray-400">{i + 1}</td>

                      {/* Faculty Info */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900 text-sm">{f.user?.name}</div>
                        <div className="text-xs text-gray-500 font-medium">S/O: {f.fatherName || "N/A"}</div>
                        <div className="text-xs text-gray-400">{f.user?.email}</div>
                        {f.contactNumber && <div className="text-[11px] text-gray-400">📞 {f.contactNumber}</div>}
                      </td>

                      {/* Designation & Qualification */}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-md bg-blue-50 text-blue-700 border border-blue-200 block w-max mb-1">
                          {f.designation || "Lecturer"}
                        </span>
                        <div className="text-xs font-medium text-gray-700">{f.qualification || "M.Phil"}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          f.educationLevel === "INTERMEDIATE" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          f.educationLevel === "BOTH" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                          "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {f.educationLevel === "INTERMEDIATE" ? "🏫 Inter Faculty" : f.educationLevel === "BOTH" ? "🎓🏫 Both (BS & Inter)" : "🎓 BS Faculty"}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4 font-semibold text-gray-800 text-xs">
                        {f.department?.name || <span className="text-gray-400 italic">Unassigned</span>}
                      </td>

                      {/* Assigned Courses */}
                      <td className="px-4 py-4 text-center">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 border">
                          {f.courses?.length || 0} Course(s)
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(f)}
                          className={`px-3 py-1 text-xs font-extrabold rounded-full border transition-all ${
                            f.isActive
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                              : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                          }`}
                        >
                          {f.isActive ? "🟢 Active" : "🔴 Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setViewingFaculty(f)}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm"
                            title="View Profile"
                          >
                            👁️
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingFaculty(f)}
                            className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center shadow-sm"
                            title="Edit Details"
                          >
                            ✏️
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={() => setDeletingFaculty(f)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center shadow-sm"
                            title="Delete Faculty"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW FACULTY PROFILE MODAL */}
      {viewingFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{viewingFaculty.user?.name}</h2>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{viewingFaculty.designation || "Faculty Member"}</p>
              </div>
              <button onClick={() => setViewingFaculty(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Father Name</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.fatherName || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Email Address</span>
                <span className="font-semibold text-gray-800 text-xs truncate block">{viewingFaculty.user?.email}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Qualification</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.qualification || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Department</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.department?.name || "Unassigned"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Contact Number</span>
                <span className="font-semibold text-gray-800">{viewingFaculty.contactNumber || "N/A"}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border">
                <span className="block text-xs font-bold text-gray-400 uppercase">Status</span>
                <span className="font-bold text-green-700">{viewingFaculty.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingFaculty(null)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT FACULTY MODAL */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Edit Faculty Details</h2>
              <button onClick={() => setEditingFaculty(null)} className="text-gray-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.user?.name || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, user: { ...editingFaculty.user, name: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father Name *</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.fatherName || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation *</label>
                  <select
                    className={INPUT_STYLE}
                    value={editingFaculty.designation || "Lecturer"}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qualification *</label>
                  <input
                    type="text"
                    className={INPUT_STYLE}
                    value={editingFaculty.qualification || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department *</label>
                  <select
                    className={INPUT_STYLE}
                    value={editingFaculty.departmentId || ""}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, departmentId: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Faculty Type *</label>
                  <select
                    className={INPUT_STYLE}
                    value={editingFaculty.educationLevel || "BOTH"}
                    onChange={(e) => setEditingFaculty({ ...editingFaculty, educationLevel: e.target.value })}
                  >
                    <option value="BS">🎓 BS Faculty</option>
                    <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                    <option value="BOTH">🎓🏫 Both (BS & Inter)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input
                  type="text"
                  className={INPUT_STYLE}
                  value={editingFaculty.contactNumber || ""}
                  onChange={(e) => setEditingFaculty({ ...editingFaculty, contactNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingFaculty(null)} className={`flex-1 ${BTN_SECONDARY}`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE FACULTY CONFIRMATION MODAL */}
      {deletingFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-4 text-center border border-red-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deactivate Faculty Member?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to deactivate <strong className="text-gray-900">"{deletingFaculty.user?.name}"</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleConfirmDelete} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
                {saving ? "Deactivating..." : "Confirm Deactivate"}
              </button>
              <button onClick={() => setDeletingFaculty(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW FACULTY MODAL (Auto-Generates Email & Pre-fills Default Password) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Register New Faculty Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Dr. Ahmad Ali"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Father Name *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Muhammad Ali"
                    value={form.fatherName}
                    onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Designation *</label>
                  <select
                    className={INPUT_STYLE}
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qualification *</label>
                  <input
                    required
                    type="text"
                    className={INPUT_STYLE}
                    placeholder="Ph.D. / M.Phil"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                    <span className="text-[10px] text-blue-600 font-semibold">✨ Auto-generated</span>
                  </div>
                  <input
                    required
                    type="email"
                    className={`${INPUT_STYLE} font-medium text-blue-900 bg-blue-50/50`}
                    placeholder={`ahmad.ali${emailDomain}`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Password *</label>
                    <span className="text-[10px] text-emerald-600 font-semibold">🔑 System Default</span>
                  </div>
                  <input
                    required
                    type="text"
                    className={`${INPUT_STYLE} font-mono font-bold text-emerald-800 bg-emerald-50/50`}
                    placeholder="gpgcq123"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department *</label>
                  <select
                    required
                    className={INPUT_STYLE}
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Faculty Type *</label>
                  <select
                    required
                    className={INPUT_STYLE}
                    value={form.educationLevel}
                    onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                  >
                    <option value="BS">🎓 BS Faculty</option>
                    <option value="INTERMEDIATE">🏫 Inter Faculty</option>
                    <option value="BOTH">🎓🏫 Both (BS & Inter)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                <input
                  type="text"
                  className={INPUT_STYLE}
                  placeholder="0300-1234567"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>
                  {saving ? "Registering..." : "Register Faculty"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 ${BTN_SECONDARY}`}>
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
