"use client";

import { useState, useEffect } from "react";

export default function ExamsResultsPage() {
  const [activeTab, setActiveTab] = useState("marks");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Examinations & Results</h1>
        <p className="text-gray-500 mt-1">Manage Marks Entry, Result Compilation, and Student Promotions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'marks' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('marks')}
          >
            Marks Entry
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('results')}
          >
            Results & Promotion
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'merit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('merit')}
          >
            Merit & Scholarships
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'marks' && (
            <MarksEntryTable />
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Compile Results & GPA</h2>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Generate Gazette</button>
              </div>
              <p className="text-gray-600 text-sm">Select a semester to compute GPA/CGPA and promote students.</p>
              <div className="max-w-xs mt-4">
                <select className="w-full px-4 py-2 border rounded-lg mb-4">
                  <option>-- Select Program & Semester --</option>
                  <option>BS CS - 1st Semester</option>
                </select>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Compute Results</button>
              </div>
            </div>
          )}

          {activeTab === 'merit' && (
            <MeritScholarshipsTab />
          )}
        </div>
      </div>
    </div>
  );
}

// GP calculation (4.0 scale) based on linear grading policy:
// 50% = 1.0, 51% = 1.1, ..., 79% = 3.9, 80%+ = 4.0
function getGP(obtained: number, total: number): number {
  if (total <= 0) return 0.00;
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded < 50) return 0.00; // Fail
  if (rounded >= 80) return 4.00; // Max GP is 4.0 (starts at 80%)

  // Formula: 1.00 + (rounded - 50) * 0.10
  return parseFloat((1.00 + (rounded - 50) * 0.10).toFixed(2));
}

// Grade letter calculation based on HEC range table from user screenshot
function getGrade(obtained: number, total: number): string {
  if (total <= 0) return "F";
  const pct = (obtained / total) * 100;
  const rounded = Math.round(pct);

  if (rounded >= 85) return "A+";
  if (rounded >= 80) return "A";
  if (rounded >= 75) return "B+";
  if (rounded >= 65) return "B";
  if (rounded >= 61) return "C+";
  if (rounded >= 55) return "C";
  if (rounded >= 50) return "D";
  return "F";
}

function MarksEntryTable() {
  const [entryType, setEntryType] = useState<"detailed" | "total">("detailed");

  // Real data from API
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseTotalMarks, setCourseTotalMarks] = useState(100); // editable total marks

  // Per-student marks: { studentId: { assignment, quiz, mid, final, totalOnly } }
  const [students, setStudents] = useState([
    { id: "1", name: "Ali Khan", roll: "BSCS-001", assignment: 0, quiz: 0, mid: 0, final: 0, totalOnly: 0 },
    { id: "2", name: "Sara Ahmed", roll: "BSCS-002", assignment: 0, quiz: 0, mid: 0, final: 0, totalOnly: 0 },
    { id: "3", name: "Usman Tariq", roll: "BSCS-003", assignment: 0, quiz: 0, mid: 0, final: 0, totalOnly: 0 },
  ]);

  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCourses(d); })
      .catch(() => { });
  }, []);

  // When course changes → auto-fill total marks from course creditHours × 25 (or use fixed 100)
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
      setCourseTotalMarks(totals[course.creditHours] ?? 100);
    }
  };

  const handleMarkChange = (id: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const student = students.find(s => s.id === id);
    if (!student) return;

    if (field === "mid" && numValue > 30) {
      alert("Midterm marks cannot exceed 30!");
      return;
    }

    if (field === "final" && numValue > 40) {
      alert("Final Term marks cannot exceed 40!");
      return;
    }

    if (field === "assignment") {
      if (numValue + student.quiz > 30) {
        alert(`Combined Assignment + Quiz marks cannot exceed 30! (Current Quiz is ${student.quiz})`);
        return;
      }
    }

    if (field === "quiz") {
      if (numValue + student.assignment > 30) {
        alert(`Combined Assignment + Quiz marks cannot exceed 30! (Current Assignment is ${student.assignment})`);
        return;
      }
    }

    setStudents(students.map(s => s.id === id ? { ...s, [field]: numValue } : s));
  };

  const getComputed = (s: any) =>
    entryType === "detailed"
      ? s.assignment + s.quiz + s.mid + s.final
      : s.totalOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold">Enter Student Marks</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${entryType === 'detailed' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setEntryType('detailed')}
          >Detailed Breakdown</button>
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${entryType === 'total' ? 'bg-white shadow-sm font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setEntryType('total')}
          >Total Only</button>
        </div>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <select className="px-4 py-2 border rounded-lg bg-white text-sm">
          <option>-- Session --</option>
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>
        <select className="px-4 py-2 border rounded-lg bg-white text-sm">
          <option>-- Program --</option>
        </select>
        <select className="px-4 py-2 border rounded-lg bg-white text-sm">
          <option>-- Semester --</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>

        {/* Course selector — auto-fills total marks */}
        <select
          className="px-4 py-2 border rounded-lg bg-white text-sm"
          value={selectedCourse}
          onChange={e => handleCourseChange(e.target.value)}
        >
          <option value="">-- Course --</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.code}) — {c.creditHours} Cr
            </option>
          ))}
        </select>
      </div>

      {/* Total Marks field — editable, auto-filled from course creditHours */}
      <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl">
        <span className="text-sm font-semibold text-blue-800">📊 Total Marks (out of):</span>
        <input
          type="number"
          min="1"
          max="200"
          step="1"
          value={courseTotalMarks}
          onChange={e => setCourseTotalMarks(parseInt(e.target.value) || 100)}
          className="w-24 px-3 py-1.5 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-700 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {selectedCourse && (
          <span className="text-xs text-blue-600">
            Auto-filled from course credit hours. You can change it.
          </span>
        )}
      </div>

      {/* Marks Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              {entryType === "detailed" ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment (30)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz (30)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mid Term (30)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Term (40)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase">Total ({courseTotalMarks})</th>
                </>
              ) : (
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-600 uppercase">Total ({courseTotalMarks})</th>
              )}
              <th className="px-4 py-3 text-center text-xs font-bold text-indigo-600 uppercase bg-indigo-50">Grade</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 uppercase bg-purple-50">GP Value</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(s => {
              const obtained = getComputed(s);
              const gp = getGP(obtained, courseTotalMarks);
              const grade = getGrade(obtained, courseTotalMarks);
              const pass = gp >= 1.0; // Pass threshold is Grade D (50%+)
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.roll}</div>
                  </td>

                  {entryType === "detailed" ? (
                    <>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="30" step="0.5" className="w-20 px-2 py-1 border rounded text-sm" value={s.assignment || ""} onChange={e => handleMarkChange(s.id, "assignment", e.target.value)} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="30" step="0.5" className="w-20 px-2 py-1 border rounded text-sm" value={s.quiz || ""} onChange={e => handleMarkChange(s.id, "quiz", e.target.value)} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="30" step="0.5" className="w-20 px-2 py-1 border rounded text-sm" value={s.mid || ""} onChange={e => handleMarkChange(s.id, "mid", e.target.value)} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="40" step="0.5" className="w-20 px-2 py-1 border rounded text-sm" value={s.final || ""} onChange={e => handleMarkChange(s.id, "final", e.target.value)} />
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-700 bg-blue-50 text-center">
                        {obtained}
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-3">
                      <input
                        type="number" min="0" max={courseTotalMarks} step="0.5"
                        className="w-24 px-3 py-1.5 border-2 border-blue-200 rounded focus:border-blue-500 font-bold text-blue-700"
                        value={s.totalOnly || ""}
                        onChange={e => handleMarkChange(s.id, "totalOnly", e.target.value)}
                      />
                    </td>
                  )}

                  {/* Grade Column */}
                  <td className="px-4 py-3 text-center bg-indigo-50 font-bold text-indigo-700">
                    {obtained === 0 ? "—" : grade}
                  </td>

                  {/* GP Column */}
                  <td className="px-4 py-3 text-center bg-purple-50">
                    <span className={`text-sm font-bold ${gp >= 3.5 ? "text-green-600" :
                      gp >= 2.0 ? "text-blue-600" :
                        gp >= 1.0 ? "text-yellow-600" :
                          "text-red-500"
                      }`}>
                      {obtained === 0 ? "—" : gp.toFixed(2)}
                    </span>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-3 text-center">
                    {obtained === 0 ? (
                      <span className="px-3 py-1 text-xs rounded-full font-semibold bg-gray-100 text-gray-500">—</span>
                    ) : pass ? (
                      <span className="px-3 py-1 text-xs rounded-full font-bold bg-green-100 text-green-700 border border-green-200">
                        ✅ Pass
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                        ❌ Fail
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Save Marks</button>
      </div>
    </div>
  );
}

function MeritScholarshipsTab() {
  const [viewAll, setViewAll] = useState(false);
  const [cgpaThreshold, setCgpaThreshold] = useState(3.5);
  const [sessionFilter, setSessionFilter] = useState("Fall 2026");
  const [programFilter, setProgramFilter] = useState("BS Computer Science");
  const [semesterFilter, setSemesterFilter] = useState("4th");

  const allStudents: Array<{
    id: number;
    name: string;
    roll: string;
    cnic: string;
    contact: string;
    program: string;
    session: string;
    currentSemester: string;
    gpa1: number | null;
    gpa2: number | null;
    gpa3: number | null;
    gpa4: number | null;
    gpa5: number | null;
    gpa6: number | null;
    gpa7: number | null;
    gpa8: number | null;
    currentCgpa: number;
    totalCgpa: number;
    cgpa: number;
  }> = [
      {
        id: 1, name: "Ali Khan", roll: "BSCS-001", cnic: "12345-6789012-3", contact: "0300-1234567",
        program: "BS Computer Science", session: "Fall 2026", currentSemester: "4th",
        gpa1: 3.80, gpa2: 3.90, gpa3: 3.95, gpa4: 3.92, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.92, totalCgpa: 3.92, cgpa: 3.92
      },
      {
        id: 2, name: "Sara Ahmed", roll: "BSCS-002", cnic: "98765-4321098-7", contact: "0311-9876543",
        program: "BS Computer Science", session: "Fall 2026", currentSemester: "4th",
        gpa1: 3.70, gpa2: 3.80, gpa3: 3.90, gpa4: 3.85, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.85, totalCgpa: 3.85, cgpa: 3.85
      },
      {
        id: 3, name: "Ayesha Noor", roll: "BSE-014", cnic: "45678-1234567-8", contact: "0322-1122334",
        program: "BS English", session: "Fall 2026", currentSemester: "2nd",
        gpa1: 3.80, gpa2: 3.70, gpa3: null, gpa4: null, gpa5: null, gpa6: null, gpa7: null, gpa8: null,
        currentCgpa: 3.75, totalCgpa: 3.75, cgpa: 3.75
      },
    ];

  const filteredStudents = allStudents
    .filter(s => s.totalCgpa >= cgpaThreshold)
    .filter(s => viewAll || (s.session === sessionFilter && s.program === programFilter && s.currentSemester === semesterFilter))
    .sort((a, b) => b.totalCgpa - a.totalCgpa);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Merit & Scholarships List</h2>
          <p className="text-gray-500 text-sm">Generate lists of top performers eligible for scholarships or honors.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Save as PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-end">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm h-full">
          <label className="text-sm font-semibold text-gray-700">Minimum CGPA:</label>
          <select
            className="border-none bg-transparent text-sm font-bold text-blue-600 py-1"
            value={cgpaThreshold}
            onChange={(e) => setCgpaThreshold(parseFloat(e.target.value))}
          >
            <option value="3.00">3.00+</option>
            <option value="3.25">3.25+</option>
            <option value="3.50">3.50+ (Honors)</option>
            <option value="3.80">3.80+ (High Honors)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">View Scope</label>
          <div className="flex bg-white rounded-lg border p-1 w-full sm:w-64">
            <button
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${!viewAll ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewAll(false)}
            >
              By Program
            </button>
            <button
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewAll ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewAll(true)}
            >
              Overall (All)
            </button>
          </div>
        </div>

        {!viewAll && (
          <>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)}>
                <option>Fall 2026</option>
                <option>Spring 2027</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Program</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
                <option>BS Computer Science</option>
                <option>BS Software Engineering</option>
                <option>BS English</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
              <select className="w-full px-4 py-2 border rounded-lg bg-white text-sm" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
                <option>1st</option>
                <option>2nd</option>
                <option>3rd</option>
                <option>4th</option>
                <option>5th</option>
                <option>6th</option>
                <option>7th</option>
                <option>8th</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">CNIC</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Department/Program</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Session</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Current Semester</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 1</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 2</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 3</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 4</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 5</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 6</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 7</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">GPA 8</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase bg-blue-50">Current CGPA</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-blue-800 uppercase bg-blue-100">Total CGPA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm whitespace-nowrap">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-8 text-center text-gray-500">
                    No students with results found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{s.roll}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.cnic}</td>
                    <td className="px-4 py-3 text-gray-600">{s.contact}</td>
                    <td className="px-4 py-3 text-gray-700">{s.program}</td>
                    <td className="px-4 py-3 text-gray-700">{s.session}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">{s.currentSemester}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa1 ? s.gpa1.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa2 ? s.gpa2.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa3 ? s.gpa3.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa4 ? s.gpa4.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa5 ? s.gpa5.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa6 ? s.gpa6.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa7 ? s.gpa7.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.gpa8 ? s.gpa8.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/50">{s.currentCgpa.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-black text-blue-800 bg-blue-100/50">{s.totalCgpa.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
