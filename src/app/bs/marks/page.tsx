"use client";
import { useState, useEffect } from "react";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const BTN_PRIMARY = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50";
const BTN_GRAY = "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200";

export default function MarksPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [entryMode, setEntryMode] = useState<"view" | "enter">("view");
  const [marksForm, setMarksForm] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => Array.isArray(d) ? setCourses(d) : setCourses([]));
    fetch("/api/students").then(r => r.json()).then(d => Array.isArray(d) ? setStudents(d.filter((s: any) => s.isActive)) : setStudents([]));
  }, []);

  const loadMarks = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    const res = await fetch(`/api/marks?courseId=${selectedCourse}`);
    if (res.ok) {
      const data = await res.json();
      setMarks(data);
      // Pre-fill form
      const init: Record<string, any> = {};
      data.forEach((m: any) => {
        init[m.studentId] = { assignment: m.assignmentMarks, quiz: m.quizMarks, midterm: m.midtermMarks, final: m.finalMarks, total: m.totalMarks };
      });
      setMarksForm(init);
    }
    setLoading(false);
  };

  const handleSaveAll = async () => {
    if (!selectedCourse) return;
    setSaving(true); setError(""); setSuccess("");
    let errors = [];
    for (const [studentId, m] of Object.entries(marksForm)) {
      const res = await fetch("/api/marks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId: selectedCourse, assignmentMarks: m.assignment, quizMarks: m.quiz, midtermMarks: m.midterm, finalMarks: m.final, totalMarks: m.total }),
      });
      if (!res.ok) errors.push(studentId);
    }
    if (errors.length > 0) setError(`${errors.length} records failed to save`);
    else setSuccess("All marks saved successfully!");
    await loadMarks();
    setEntryMode("view");
    setSaving(false);
  };

  const initBlankMarks = () => {
    const init: Record<string, any> = { ...marksForm };
    students.forEach(s => {
      if (!init[s.id]) init[s.id] = { assignment: 0, quiz: 0, midterm: 0, final: 0, total: 100 };
    });
    setMarksForm(init);
  };

  const course = courses.find(c => c.id === selectedCourse);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">📝 Marks Entry</h1>
        <p className="text-gray-500 mt-1">Enter and manage student marks per course.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm border border-green-100">{success}</div>}

      {/* Course Selector */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Select Course</label>
          <select className={INPUT} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
            <option value="">-- Select a Course --</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title} — Sem {c.semester} ({c.program?.name || ""})</option>)}
          </select>
        </div>
        <button onClick={loadMarks} disabled={!selectedCourse || loading} className={BTN_PRIMARY}>{loading ? "Loading..." : "Load Marks"}</button>
        {marks.length > 0 || selectedCourse ? (
          <button onClick={() => { setEntryMode("enter"); initBlankMarks(); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">✏️ Enter Marks</button>
        ) : null}
      </div>

      {/* Marks Table — View Mode */}
      {entryMode === "view" && marks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">{course?.title} — Marks Summary</h2>
            <span className="text-sm text-gray-500">{marks.length} students</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Student","Roll No","Assignment","Quiz","Midterm","Final","Total","Obtained","%"].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marks.map(m => {
                  const pct = m.totalMarks > 0 ? ((m.obtainedMarks / m.totalMarks) * 100).toFixed(1) : "0";
                  const pass = parseFloat(pct) >= 50;
                  return (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.student?.user?.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.student?.rollNumber}</td>
                      <td className="px-4 py-3 text-center">{m.assignmentMarks}</td>
                      <td className="px-4 py-3 text-center">{m.quizMarks}</td>
                      <td className="px-4 py-3 text-center">{m.midtermMarks}</td>
                      <td className="px-4 py-3 text-center">{m.finalMarks}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{m.totalMarks}</td>
                      <td className="px-4 py-3 text-center font-bold">{m.obtainedMarks}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{pct}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      {entryMode === "enter" && selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b bg-orange-50 flex justify-between items-center">
            <h2 className="font-semibold text-orange-800">✏️ Marks Entry Mode — {course?.title}</h2>
            <div className="flex gap-2">
              <button onClick={handleSaveAll} disabled={saving} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">{saving ? "Saving..." : "💾 Save All"}</button>
              <button onClick={() => setEntryMode("view")} className={BTN_GRAY}>Cancel</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Roll No</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Assignment<br/><span className="text-xs text-gray-400">/20</span></th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Quiz<br/><span className="text-xs text-gray-400">/10</span></th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Midterm<br/><span className="text-xs text-gray-400">/30</span></th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Final<br/><span className="text-xs text-gray-400">/40</span></th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const m = marksForm[s.id] || { assignment: 0, quiz: 0, midterm: 0, final: 0, total: 100 };
                  const upd = (k: string, v: string) => setMarksForm(f => ({ ...f, [s.id]: { ...m, [k]: parseFloat(v) || 0 } }));
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{s.user?.name}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                      {["assignment","quiz","midterm","final"].map(k => (
                        <td key={k} className="px-4 py-2 text-center">
                          <input type="number" min="0" step="0.5" className="w-16 text-center px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-400" value={m[k]} onChange={e => upd(k, e.target.value)} />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center font-bold text-gray-700">{(m.assignment + m.quiz + m.midterm + m.final).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
