"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
const BTN_GRAY = "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200";
const SESSIONS = ["2022", "2023", "2024", "2025", "2026", "2027"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterProg, setFilterProg] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSession, setFilterSession] = useState("");

  const [form, setForm] = useState({
    title: "", code: "", creditHours: "3", courseType: "THEORY",
    session: "2026", semester: "1", programId: "", departmentId: "",
    facultyId: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProg) params.set("programId", filterProg);
    if (filterSem) params.set("semester", filterSem);
    if (filterSession) params.set("session", filterSession);

    const [cRes, pRes, dRes, fRes] = await Promise.all([
      fetch(`/api/courses?${params}`),
      fetch("/api/programs"),
      fetch("/api/departments"),
      fetch("/api/faculty"),
    ]);
    if (cRes.ok) setCourses(await cRes.json());
    if (pRes.ok) setPrograms(await pRes.json());
    if (dRes.ok) setDepartments(await dRes.json());
    if (fRes.ok) setFacultyList(await fRes.json());
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/courses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setSuccess(`Course "${data.title}" created!`); setShowAdd(false); setForm({ title: "", code: "", creditHours: "3", courseType: "THEORY", session: "2026", semester: "1", programId: "", departmentId: "", facultyId: "" }); fetchAll(); }
    else setError(data.error);
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editItem) return; setSaving(true); setError("");
    const res = await fetch(`/api/courses/${editItem.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editItem.title, code: editItem.code, creditHours: editItem.creditHours, courseType: editItem.courseType, semester: editItem.semester, facultyId: editItem.facultyId }),
    });
    if (res.ok) { setSuccess("Course updated!"); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); setError(d.error); }
    setSaving(false);
  };

  const handleToggle = async (c: any) => {
    await fetch(`/api/courses/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    fetchAll();
  };

  const F = ({ label, children }: any) => (
    <div><label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Course Management</h1>
          <p className="text-gray-500 mt-1">Create and manage BS courses with faculty assignments.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className={BTN_PRIMARY}>+ Add Course</button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">{success}</div>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterSession} onChange={e => setFilterSession(e.target.value)}>
          <option value="">-- All Sessions --</option>
          {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterProg} onChange={e => setFilterProg(e.target.value)}>
          <option value="">-- All Programs --</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="px-3 py-2 border rounded-lg text-sm" value={filterSem} onChange={e => setFilterSem(e.target.value)}>
          <option value="">-- All Semesters --</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <button onClick={fetchAll} className={BTN_PRIMARY}>Filter</button>
        <span className="self-center text-sm text-gray-500">{courses.length} courses</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <p className="text-center py-12 text-gray-400">Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["#","Title & Code","Program","Sem","Session","Faculty","Type","Status","Actions"].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={c.id} className={`border-b hover:bg-gray-50 ${!c.isActive ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 text-gray-400">{i+1}</td>
                    <td className="px-4 py-3"><div className="font-medium text-gray-900">{c.title}</div><div className="text-xs text-gray-500">{c.code}</div></td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{c.program?.name || "—"}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.semester}</td>
                    <td className="px-4 py-3 text-gray-600">{c.session}</td>
                    <td className="px-4 py-3 text-xs">{c.faculty?.user?.name || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-full ${c.courseType === "THEORY" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{c.courseType}</span></td>
                    <td className="px-4 py-3"><button onClick={() => handleToggle(c)} className={`px-2 py-1 text-xs rounded-full font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.isActive ? "Active" : "Inactive"}</button></td>
                    <td className="px-4 py-3"><button onClick={() => setEditItem({ ...c, facultyId: c.facultyId || "" })} className="text-blue-600 text-xs hover:underline">Edit</button></td>
                  </tr>
                ))}
                {courses.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-gray-400">No courses found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Add New Course</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="Course Title *"><input required className={INPUT} placeholder="e.g. Data Structures" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></F>
                <F label="Code *"><input required className={INPUT} placeholder="e.g. CS-201" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></F>
                <F label="Credit Hours *"><input required type="number" min="1" max="4" className={INPUT} value={form.creditHours} onChange={e => setForm(f => ({ ...f, creditHours: e.target.value }))} /></F>
                <F label="Type"><select className={INPUT} value={form.courseType} onChange={e => setForm(f => ({ ...f, courseType: e.target.value }))}><option value="THEORY">Theory</option><option value="PRACTICAL">Practical</option></select></F>
                <F label="Session"><select className={INPUT} value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))}>{SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></F>
                <F label="Semester *"><select required className={INPUT} value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select></F>
              </div>
              <F label="Program *"><select required className={INPUT} value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}><option value="">-- Select Program --</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></F>
              <F label="Department"><select className={INPUT} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}><option value="">-- Select Department --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></F>
              <F label="Assign Faculty"><select className={INPUT} value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}><option value="">-- No Faculty --</option>{facultyList.filter(f => f.isActive).map(f => <option key={f.id} value={f.id}>{f.user?.name}</option>)}</select></F>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>{saving ? "Creating..." : "Create Course"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className={`flex-1 ${BTN_GRAY}`}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Edit Course</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Title</label><input className={INPUT} value={editItem.title} onChange={e => setEditItem((i: any) => ({ ...i, title: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Code</label><input className={INPUT} value={editItem.code} onChange={e => setEditItem((i: any) => ({ ...i, code: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Faculty</label><select className={INPUT} value={editItem.facultyId} onChange={e => setEditItem((i: any) => ({ ...i, facultyId: e.target.value }))}><option value="">-- None --</option>{facultyList.filter(f => f.isActive).map(f => <option key={f.id} value={f.id}>{f.user?.name}</option>)}</select></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} disabled={saving} className={`flex-1 ${BTN_PRIMARY}`}>{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditItem(null)} className={`flex-1 ${BTN_GRAY}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
