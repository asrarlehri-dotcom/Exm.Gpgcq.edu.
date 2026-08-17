"use client";

import { useState, useEffect } from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";
import { useSettings } from "@/lib/useSettings";

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
  const { collegeName, collegeLogo, collegeTagline } = useSettings();
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
    <div className="space-y-6 font-sans">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>
      
      {/* Print-only Official Header */}
      <div className="hidden print:block text-center border-b-[3px] border-slate-900 pb-6 mb-8 relative">
        {/* Watermark in print */}
        {collegeLogo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
            <img src={collegeLogo} alt="watermark" className="w-96 h-96 grayscale" />
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center">
          {collegeLogo ? (
            <img src={collegeLogo} alt="College Logo" className="w-16 h-16 object-contain mb-3 drop-shadow-sm" />
          ) : (
            <div className="text-4xl mb-2">🏛️</div>
          )}
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">{collegeName}</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{collegeTagline || "Excellence in Education"}</p>
          <div className="mt-6 inline-block bg-slate-900 text-white px-6 py-1.5 rounded-full border border-slate-700">
            <h2 className="text-base font-black uppercase tracking-widest">Official Results Gazette - Semester {selectedSemester}</h2>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Results Gazette</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Display and compile complete official result sheets for semesters and programs.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 print:hidden transition-all flex items-center gap-2"
        >
          🖨️ Print Gazette
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-center print:hidden">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Select Semester:</label>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
          className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-0 bg-slate-50 transition-colors"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl print:rounded-none shadow-sm print:shadow-none border border-slate-200 print:border-none overflow-hidden relative z-10">
        {loading ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest">Compiling Gazette...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-800">
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs">Roll Number</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs">Student Name</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs text-center border-l border-slate-700 print:border-slate-300">SGPA</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs text-center border-l border-slate-700 print:border-slate-300">CGPA</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs border-l border-slate-700 print:border-slate-300">Failed Courses</th>
                  <th className="px-5 py-4 font-black uppercase tracking-wider text-xs text-center border-l border-slate-700 print:border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((s, idx) => {
                  const { sgpa, cgpa, failedCourses, status } = getStudentResults(s);
                  return (
                    <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors`}>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700 border-r border-slate-100 print:border-slate-300">{s.rollNumber}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 border-r border-slate-100 print:border-slate-300">{s.user?.name}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700 border-r border-slate-100 print:border-slate-300">{sgpa.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-center font-black text-blue-700 border-r border-slate-100 print:border-slate-300 bg-blue-50/30 print:bg-transparent">
                        {cgpa.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 border-r border-slate-100 print:border-slate-300">
                        {failedCourses.length > 0 ? (
                          <span className="text-rose-600 text-[11px] font-bold uppercase">
                            {failedCourses.join(", ")}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-[11px] font-black tracking-widest uppercase">ALL PASS</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                          status === "PROMOTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 print:border-none print:p-0"
                            : status === "PROBATION"
                            ? "bg-amber-50 text-amber-700 border-amber-200 print:border-none print:p-0"
                            : "bg-rose-50 text-rose-700 border-rose-200 print:border-none print:p-0"
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Print Footer */}
            <div className="hidden print:flex mt-12 justify-between items-end text-xs font-bold text-slate-800 uppercase tracking-widest">
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                Prepared By (Clerk)
              </div>
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                Controller of Examinations
              </div>
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
                Principal Signature
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
