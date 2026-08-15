"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  getDepartments, 
  addDepartment, 
  toggleDepartmentStatus, 
  getPrograms, 
  addProgram, 
  toggleProgramStatus,
  updateDepartment,
  deleteDepartment,
  updateProgram,
  deleteProgram 
} from "./actions";

export default function DepartmentsProgramsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"departments" | "programs">("departments");
  const [isPending, startTransition] = useTransition();

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Search & Pagination controls
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add New Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for Department
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptHod, setDeptHod] = useState("");
  const [deptPhone, setDeptPhone] = useState("+123 4567890");
  const [deptEmail, setDeptEmail] = useState("dept@example.com");
  const [deptStartYear, setDeptStartYear] = useState("2020");
  const [deptCapacity, setDeptCapacity] = useState("150");

  // Form states for Program
  const [progName, setProgName] = useState("");
  const [progCode, setProgCode] = useState("");
  const [progLevel, setProgLevel] = useState("BS");
  const [progDeptId, setProgDeptId] = useState("");

  // Edit and Feedback states
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [editingProg, setEditingProg] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Safeguard Lock Modal state
  const [lockedItem, setLockedItem] = useState<{
    type: "department" | "program";
    name: string;
    studentCount: number;
    marksCount?: number;
    action: "edit" | "delete";
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const fetchedDepts = await getDepartments();
    const fetchedProgs = await getPrograms();
    setDepartments(fetchedDepts);
    setPrograms(fetchedProgs);
  };

  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    startTransition(async () => {
      await addDepartment({ 
        name: deptName, 
        code: deptCode, 
        hodName: deptHod,
        phone: deptPhone,
        email: deptEmail,
        startingYear: parseInt(deptStartYear) || 2020,
        studentCapacity: parseInt(deptCapacity) || 150
      });
      setDeptName("");
      setDeptCode("");
      setDeptHod("");
      setShowAddModal(false);
      fetchData();
      setSuccess(`Department "${deptName}" added successfully!`);
    });
  };

  const handleAddProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName || !progCode || !progDeptId) return;
    startTransition(async () => {
      await addProgram({ name: progName, code: progCode, educationLevel: progLevel, departmentId: progDeptId });
      setProgName("");
      setProgCode("");
      setProgDeptId("");
      setShowAddModal(false);
      fetchData();
      setSuccess(`Program "${progName}" added successfully!`);
    });
  };

  const handleToggleDept = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleDepartmentStatus(id, !currentStatus);
      fetchData();
    });
  };

  const handleToggleProg = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleProgramStatus(id, !currentStatus);
      fetchData();
    });
  };

  // Intercept Delete Department
  const handleDeleteDept = async (dept: any) => {
    if (dept.hasData || dept.studentCount > 0) {
      setLockedItem({
        type: "department",
        name: dept.name,
        studentCount: dept.studentCount || 0,
        action: "delete"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await deleteDepartment(dept.id);
      if (res.success) {
        setSuccess(`Department "${dept.name}" deleted successfully.`);
        fetchData();
      } else {
        setError(res.error || "Failed to delete department.");
      }
    });
  };

  // Intercept Delete Program
  const handleDeleteProg = async (prog: any) => {
    if (prog.hasData || prog.studentCount > 0 || prog.marksCount > 0) {
      setLockedItem({
        type: "program",
        name: prog.name,
        studentCount: prog.studentCount || 0,
        marksCount: prog.marksCount || 0,
        action: "delete"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete program "${prog.name}"?`)) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await deleteProgram(prog.id);
      if (res.success) {
        setSuccess(`Program "${prog.name}" deleted successfully.`);
        fetchData();
      } else {
        setError(res.error || "Failed to delete program.");
      }
    });
  };

  // Intercept Edit Department
  const handleEditDeptClick = (dept: any) => {
    if (dept.hasData || dept.studentCount > 0) {
      setLockedItem({
        type: "department",
        name: dept.name,
        studentCount: dept.studentCount || 0,
        action: "edit"
      });
      return;
    }
    setEditingDept({ id: dept.id, name: dept.name, code: dept.code, hodName: dept.hodName || "" });
  };

  // Intercept Edit Program
  const handleEditProgClick = (prog: any) => {
    if (prog.hasData || prog.studentCount > 0 || prog.marksCount > 0) {
      setLockedItem({
        type: "program",
        name: prog.name,
        studentCount: prog.studentCount || 0,
        marksCount: prog.marksCount || 0,
        action: "edit"
      });
      return;
    }
    setEditingProg({ 
      id: prog.id, 
      name: prog.name, 
      code: prog.code || "", 
      educationLevel: prog.educationLevel, 
      departmentId: prog.departmentId || "" 
    });
  };

  const handleUpdateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name || !editingDept.code) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateDepartment(editingDept.id, {
        name: editingDept.name,
        code: editingDept.code,
        hodName: editingDept.hodName || ""
      });
      if (res.success) {
        setSuccess(`Department "${editingDept.name}" updated successfully.`);
        setEditingDept(null);
        fetchData();
      } else {
        setError(res.error || "Failed to update department.");
      }
    });
  };

  const handleUpdateProg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProg || !editingProg.name || !editingProg.code || !editingProg.departmentId) return;
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await updateProgram(editingProg.id, {
        name: editingProg.name,
        code: editingProg.code,
        educationLevel: editingProg.educationLevel,
        departmentId: editingProg.departmentId
      });
      if (res.success) {
        setSuccess(`Program "${editingProg.name}" updated successfully.`);
        setEditingProg(null);
        fetchData();
      } else {
        setError(res.error || "Failed to update program.");
      }
    });
  };

  // Filtered lists based on search
  const filteredDepartments = departments.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.code && d.code.toLowerCase().includes(q)) || (d.hodName && d.hodName.toLowerCase().includes(q));
  });

  const filteredPrograms = programs.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q));
  });

  const displayedDepts = filteredDepartments.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const displayedProgs = filteredPrograms.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Switcher */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏢 Programs & Departments Setup</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage academic departments, degree programs, and capacity settings.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border">
          <button 
            className={`px-5 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'departments' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => {
              setActiveTab('departments');
              setCurrentPage(1);
            }}
          >
            🏢 Departments
          </button>
          <button 
            className={`px-5 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'programs' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => {
              setActiveTab('programs');
              setCurrentPage(1);
            }}
          >
            🎓 Programs
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Main Content Card — Exactly matching attached screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Card Header Bar */}
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            {activeTab === "departments" ? "Department List" : "Program List"}
          </h2>
          <button className="text-gray-400 hover:text-gray-600 text-xl font-bold px-2 py-1 rounded">
            ⋮
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Controls Row: Add New + | Entries dropdown | Search input */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm flex items-center gap-2"
              >
                <span>Add New</span>
                <span className="text-lg font-bold">+</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <select
                  value={entriesPerPage}
                  onChange={e => {
                    setEntriesPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-400"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries per page</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-indigo-400 w-48 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* TABLE SECTION — Matching screenshot header colors and column layout */}
          {activeTab === "departments" ? (
            <div className="overflow-x-auto border border-indigo-100 rounded-xl shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-600 text-white font-bold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-center">#</th>
                    <th className="px-6 py-3.5">DEPT. NAME</th>
                    <th className="px-6 py-3.5">HEAD OF DEPT.</th>
                    <th className="px-4 py-3.5">PHONE</th>
                    <th className="px-6 py-3.5">EMAIL</th>
                    <th className="px-4 py-3.5 text-center">STARTING YEAR</th>
                    <th className="px-4 py-3.5 text-center">STUDENT CAPACITY</th>
                    <th className="px-4 py-3.5 text-center">EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {displayedDepts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500 font-medium">
                        No departments found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedDepts.map((d, index) => {
                      const rowNum = (currentPage - 1) * entriesPerPage + index + 1;
                      return (
                        <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-4 text-center font-semibold text-gray-600">{rowNum}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{d.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{d.code}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">{d.hodName || "—"}</td>
                          <td className="px-4 py-4 text-gray-600 text-xs font-mono">{d.phone || "+123 4567890"}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{d.email || "dept@example.com"}</td>
                          <td className="px-4 py-4 text-center font-medium text-gray-700">{d.startingYear || 2020}</td>
                          <td className="px-4 py-4 text-center font-bold text-gray-800">
                            {d.studentCapacity || 150}
                            {d.studentCount > 0 && (
                              <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-extrabold">
                                ({d.studentCount} Active)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Green Edit Pencil Button */}
                              <button
                                onClick={() => handleEditDeptClick(d)}
                                className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors shadow-sm"
                                title="Edit Department"
                              >
                                ✏️
                              </button>
                              {/* Red Trash Delete Button */}
                              <button
                                onClick={() => handleDeleteDept(d)}
                                className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors shadow-sm"
                                title="Delete Department"
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
          ) : (
            /* PROGRAMS TABLE */
            <div className="overflow-x-auto border border-indigo-100 rounded-xl shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-600 text-white font-bold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-center">#</th>
                    <th className="px-6 py-3.5">PROGRAM NAME</th>
                    <th className="px-4 py-3.5 text-center">CODE</th>
                    <th className="px-4 py-3.5 text-center">LEVEL</th>
                    <th className="px-6 py-3.5">DEPARTMENT</th>
                    <th className="px-4 py-3.5 text-center">ENROLLED STUDENTS</th>
                    <th className="px-4 py-3.5 text-center">EDIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {displayedProgs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500 font-medium">
                        No programs found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedProgs.map((p, index) => {
                      const rowNum = (currentPage - 1) * entriesPerPage + index + 1;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-4 text-center font-semibold text-gray-600">{rowNum}</td>
                          <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                          <td className="px-4 py-4 text-center font-mono text-xs text-gray-600">{p.code || "—"}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                              {p.educationLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">{p.department?.name || "—"}</td>
                          <td className="px-4 py-4 text-center font-extrabold text-blue-700">
                            {p.studentCount || 0}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Green Edit Pencil Button */}
                              <button
                                onClick={() => handleEditProgClick(p)}
                                className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors shadow-sm"
                                title="Edit Program"
                              >
                                ✏️
                              </button>
                              {/* Red Trash Delete Button */}
                              <button
                                onClick={() => handleDeleteProg(p)}
                                className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors shadow-sm"
                                title="Delete Program"
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
      </div>

      {/* SAFEGUARD LOCK MODAL — Redirects to /admin/settings when active data exists */}
      {lockedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md space-y-5 border border-amber-200 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔒
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Major Action Locked</h2>
              <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
                Active Student & Results Data Detected!
              </p>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed text-left">
              The {lockedItem.type} <strong className="text-gray-900">"{lockedItem.name}"</strong> contains{" "}
              <strong className="text-indigo-700">{lockedItem.studentCount} enrolled student records</strong>
              {lockedItem.marksCount ? ` and ${lockedItem.marksCount} marks/result entries` : ""}.
              Direct {lockedItem.action} or structural edits are restricted here to prevent corrupting student roll numbers and grade transcripts.
            </p>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 text-left">
              💡 <strong>Requirement:</strong> Major administrative changes or permission overrides must be managed through System Settings Control Center.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setLockedItem(null);
                  router.push("/admin/settings");
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>⚙️ Go to System Settings</span>
              </button>
              <button
                onClick={() => setLockedItem(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === "departments" ? "Add New Department" : "Add New Program"}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {activeTab === "departments" ? (
              <form onSubmit={handleAddDepartmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department Name *</label>
                  <input type="text" required value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Mechanical Engg." className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code *</label>
                    <input type="text" required value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="e.g. ME" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Head of Dept. (HOD)</label>
                    <input type="text" value={deptHod} onChange={e => setDeptHod(e.target.value)} placeholder="e.g. Sanjay Chohan" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="text" value={deptPhone} onChange={e => setDeptPhone(e.target.value)} placeholder="+123 4567890" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" value={deptEmail} onChange={e => setDeptEmail(e.target.value)} placeholder="test@example.com" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starting Year</label>
                    <input type="number" value={deptStartYear} onChange={e => setDeptStartYear(e.target.value)} placeholder="1998" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student Capacity</label>
                    <input type="number" value={deptCapacity} onChange={e => setDeptCapacity(e.target.value)} placeholder="150" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm">
                    {isPending ? "Saving..." : "Save Department"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddProgramSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program Name *</label>
                  <input type="text" required value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. BS Computer Science" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program Code *</label>
                    <input type="text" required value={progCode} onChange={e => setProgCode(e.target.value)} placeholder="e.g. BSCS" className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level *</label>
                    <select value={progLevel} onChange={e => setProgLevel(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400">
                      <option value="BS">BS</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department *</label>
                  <select required value={progDeptId} onChange={e => setProgDeptId(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400">
                    <option value="" disabled>-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm">
                    {isPending ? "Saving..." : "Save Program"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL (For items without active data) */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Department</h2>
            <form onSubmit={handleUpdateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingDept.code}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">HOD Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingDept.hodName}
                  onChange={(e) => setEditingDept({ ...editingDept, hodName: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROGRAM MODAL (For items without active data) */}
      {editingProg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Program</h2>
            <form onSubmit={handleUpdateProg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Program Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingProg.name}
                  onChange={(e) => setEditingProg({ ...editingProg, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingProg.code}
                  onChange={(e) => setEditingProg({ ...editingProg, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingProg.educationLevel}
                  onChange={(e) => setEditingProg({ ...editingProg, educationLevel: e.target.value })}
                >
                  <option value="BS">BS</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400"
                  value={editingProg.departmentId}
                  onChange={(e) => setEditingProg({ ...editingProg, departmentId: e.target.value })}
                >
                  <option value="" disabled>-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProg(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
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
