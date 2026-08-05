"use client";

import { useState, useEffect } from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";

type StudentData = {
  id: string;
  rollNumber: string;
  user: { name: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  marks: Array<{
    semester: number;
    obtainedMarks: number;
    totalMarks: number;
    course: { creditHours: number; title: string };
  }>;
};

export default function GazetteCompilerPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data.filter((s: any) => s.educationLevel === "BS"));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const getStudentResults = (s: StudentData) => {
    const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
    let failedCourses: string[] = [];

    s.marks?.forEach((m) => {
      const sem = m.semester;
      const credit = m.course?.creditHours || 3;
      const pct = m.totalMarks > 0 ? (m.obtainedMarks / m.totalMarks) * 100 : 0;
      let gp = 0;
      if (pct >= 80) gp = 4.0;
      else if (pct >= 50) gp = 1.0 + (Math.round(pct) - 50) * 0.1;
      else {
        // Failed
        if (sem === selectedSemester) failedCourses.push(m.course?.title || "Subject");
      }

      if (!semestersMap[sem]) {
        semestersMap[sem] = { gpPoints: 0, credits: 0 };
      }
      semestersMap[sem].gpPoints += gp * credit;
      semestersMap[sem].credits += credit;
    });

    const semestersData = Object.entries(semestersMap).map(([semStr, d]) => ({
      semester: parseInt(semStr),
      gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
      creditHours: d.credits,
    }));

    const { cgpa } = calculateStudentCGPA(
      { bsAdmissionType: s.bsAdmissionType },
      semestersData
    );

    const targetSem = semestersData.find((sd) => sd.semester === selectedSemester);
    const sgpa = targetSem ? targetSem.gpa : 0;

    let status = "PROMOTED";
    if (sgpa < 2.0 && sgpa >= 1.0) status = "PROBATION";
    else if (sgpa < 1.0 && targetSem) status = "DROPOUT";

    return {
      sgpa,
      cgpa,
      failedCourses,
      status,
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Official Results Gazette</h1>
          <p className="text-gray-500 mt-1">
            Display and compile complete result sheets for semesters and programs.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm print:hidden transition-all"
        >
          🖨️ Print Gazette
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center print:hidden">
        <label className="text-sm font-semibold text-gray-700">Select Semester to view Gazette:</label>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">Compiling Gazette...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 font-semibold text-gray-600">Roll Number</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Student Name</th>
                  <th className="px-5 py-3 font-semibold text-center">SGPA</th>
                  <th className="px-5 py-3 font-semibold text-center">CGPA</th>
                  <th className="px-5 py-3 font-semibold">Failed Courses</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const { sgpa, cgpa, failedCourses, status } = getStudentResults(s);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-gray-700">{s.rollNumber}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{s.user?.name}</td>
                      <td className="px-5 py-4 text-center font-bold">{sgpa.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center font-extrabold text-blue-700">
                        {cgpa.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        {failedCourses.length > 0 ? (
                          <span className="text-red-600 text-xs font-semibold">
                            {failedCourses.join(", ")}
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs font-bold">ALL PASS</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full ${
                          status === "PROMOTED"
                            ? "bg-green-100 text-green-700"
                            : status === "PROBATION"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {status}
                        </span>
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
  );
}
