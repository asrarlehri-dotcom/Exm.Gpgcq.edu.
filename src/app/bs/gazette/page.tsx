"use client";

import { useState, useEffect } from "react";
import { getGPValue, calculateStudentCGPA } from "@/lib/cgpa";
import { useSettings } from "@/lib/useSettings";

type MarkEntry = {
  courseId?: string;
  semester?: number;
  obtainedMarks: number;
  totalMarks: number;
  course: { id?: string; creditHours: number; title: string; semester?: number; code?: string; programId?: string };
};

type FailedCourse = {
  id?: string;
  title: string;
  code?: string;
  programId?: string;
};

type StudentData = {
  id: string;
  rollNumber: string;
  session: string | null;
  user: { name: string };
  currentSemester: number | null;
  bsAdmissionType: string | null;
  programId: string | null;
  program: { id: string; name: string } | null;
  marks: MarkEntry[];
};

type Program = { id: string; name: string; educationLevel: string };

/** Derives letter grade from GPA and Percentage using standard HEC scale */
function getGrade(gpa: number, pct: number): string {
  if (gpa >= 3.80 || pct >= 85) return "A+";
  if (gpa >= 3.50 || pct >= 80) return "A";
  if (gpa >= 3.00 || pct >= 75) return "B+";
  if (gpa >= 2.50 || pct >= 65) return "B";
  if (gpa >= 2.00 || pct >= 58) return "C";
  if (gpa >= 1.00 || pct >= 50) return "D";
  return "F";
}

/** Academic Discipline Standard Color Theme Palette */
function getProgramColor(progName: string) {
  const p = (progName || "").toLowerCase();

  // BS Computer Science: Dark Blue
  if (p.includes("computer")) {
    return {
      headerBg: "bg-blue-950/95 print:bg-blue-50",
      badgeBg: "bg-blue-600/30 text-blue-200 border-blue-400/50 print:bg-blue-100 print:text-blue-900",
      accentText: "text-blue-300 print:text-blue-800",
      bannerBg: "from-blue-950 via-slate-900 to-slate-950 border-blue-800/60",
      indicatorColor: "bg-blue-500",
    };
  }

  // BS Chemistry: Golden Yellow (Science standard)
  if (p.includes("chem")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Economics: Copper / Rust (Currency & Trade standard)
  if (p.includes("econ")) {
    return {
      headerBg: "bg-[#2d160e] print:bg-orange-50",
      badgeBg: "bg-[#8b4513]/40 text-orange-200 border-orange-500/50 print:bg-orange-100 print:text-orange-900",
      accentText: "text-orange-300 print:text-orange-800",
      bannerBg: "from-[#2d160e] via-slate-900 to-slate-950 border-orange-800/60",
      indicatorColor: "bg-orange-500",
    };
  }

  // BS Education: Light Blue / Sky Blue
  if (p.includes("education")) {
    return {
      headerBg: "bg-sky-950/90 print:bg-sky-50",
      badgeBg: "bg-sky-500/25 text-sky-200 border-sky-400/60 print:bg-sky-100 print:text-sky-900",
      accentText: "text-sky-300 print:text-sky-800",
      bannerBg: "from-sky-950 via-slate-900 to-slate-950 border-sky-800/60",
      indicatorColor: "bg-sky-500",
    };
  }

  // BS English: Pure White / Silver (Arts & Literature standard)
  if (p.includes("english")) {
    return {
      headerBg: "bg-slate-900 print:bg-slate-50",
      badgeBg: "bg-white text-slate-950 border-slate-200 font-black print:bg-slate-200 print:text-slate-900",
      accentText: "text-slate-200 print:text-slate-800",
      bannerBg: "from-slate-800 via-slate-900 to-slate-950 border-slate-600/60",
      indicatorColor: "bg-slate-300",
    };
  }

  // BS Geography: Golden Yellow (Science faculty) / White
  if (p.includes("geograph")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Islamiat: Islamic Green / White
  if (p.includes("islam")) {
    return {
      headerBg: "bg-emerald-950/95 print:bg-emerald-50",
      badgeBg: "bg-emerald-600/30 text-emerald-200 border-emerald-400/60 print:bg-emerald-100 print:text-emerald-900",
      accentText: "text-emerald-300 print:text-emerald-800",
      bannerBg: "from-emerald-950 via-slate-900 to-slate-950 border-emerald-800/60",
      indicatorColor: "bg-emerald-500",
    };
  }

  // BS Math / Mathematics: Golden Yellow (Science standard)
  if (p.includes("math")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Physics: Golden Yellow (Science standard)
  if (p.includes("physic")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // BS Political Science: Dark Blue
  if (p.includes("politic")) {
    return {
      headerBg: "bg-blue-950/95 print:bg-blue-50",
      badgeBg: "bg-blue-600/30 text-blue-200 border-blue-400/50 print:bg-blue-100 print:text-blue-900",
      accentText: "text-blue-300 print:text-blue-800",
      bannerBg: "from-blue-950 via-slate-900 to-slate-950 border-blue-800/60",
      indicatorColor: "bg-blue-500",
    };
  }

  // BS Sociology: Citron / Lime (Social Sciences standard)
  if (p.includes("sociolog")) {
    return {
      headerBg: "bg-lime-950/90 print:bg-lime-50",
      badgeBg: "bg-lime-500/25 text-lime-200 border-lime-400/60 print:bg-lime-100 print:text-lime-900",
      accentText: "text-lime-300 print:text-lime-800",
      bannerBg: "from-lime-950 via-slate-900 to-slate-950 border-lime-800/60",
      indicatorColor: "bg-lime-500",
    };
  }

  // BS Zoology / Botany / Biology: Golden Yellow (Biology & Sciences standard)
  if (p.includes("zoolo") || p.includes("botan") || p.includes("biolog")) {
    return {
      headerBg: "bg-amber-950/90 print:bg-amber-50",
      badgeBg: "bg-amber-500/25 text-amber-300 border-amber-400/60 print:bg-amber-100 print:text-amber-900",
      accentText: "text-amber-300 print:text-amber-800",
      bannerBg: "from-amber-950 via-slate-900 to-slate-950 border-amber-800/60",
      indicatorColor: "bg-amber-500",
    };
  }

  // Default / Other disciplines
  return {
    headerBg: "bg-slate-900 print:bg-slate-100",
    badgeBg: "bg-violet-500/25 text-violet-200 border-violet-400/50 print:bg-violet-100 print:text-violet-900",
    accentText: "text-slate-300 print:text-slate-700",
    bannerBg: "from-slate-900 via-slate-900 to-slate-950 border-slate-700",
    indicatorColor: "bg-blue-500",
  };
}

/** Derives student results for a given semester using the shared cgpa lib */
function buildStudentResults(
  s: StudentData,
  selectedSemester: number
) {
  const semestersMap: Record<number, { gpPoints: number; credits: number }> = {};
  const failedCourses: FailedCourse[] = [];

  (s.marks || []).forEach((m) => {
    const sem = m.course?.semester ?? m.semester ?? 1;
    const credit = m.course?.creditHours || 3;
    const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
    const gp = isAbsent ? 0.0 : getGPValue(m.obtainedMarks, m.totalMarks);

    if ((gp === 0 || isAbsent) && sem === selectedSemester) {
      failedCourses.push({
        id: m.course?.id,
        title: isAbsent ? `${m.course?.title || "Subject"} (A)` : (m.course?.title || "Subject"),
        code: m.course?.code,
        programId: m.course?.programId || s.programId || undefined,
      });
    }

    if (!semestersMap[sem]) semestersMap[sem] = { gpPoints: 0, credits: 0 };
    semestersMap[sem].gpPoints += gp * credit;
    semestersMap[sem].credits += credit;
  });

  const semestersData = Object.entries(semestersMap).map(([semStr, d]) => ({
    semester: parseInt(semStr),
    gpa: d.credits > 0 ? parseFloat((d.gpPoints / d.credits).toFixed(2)) : 0,
    creditHours: d.credits,
  }));

  const { cgpa } = calculateStudentCGPA({ bsAdmissionType: s.bsAdmissionType }, semestersData);
  const targetSem = semestersData.find((sd) => sd.semester === selectedSemester);
  const gpa = targetSem ? targetSem.gpa : 0;

  // Per-course marks + totals for selected semester (supports both ID and Title lookup)
  const courseMarksById: Record<string, number | "A"> = {};
  const courseMarksByTitle: Record<string, number | "A"> = {};
  let totalObtained = 0;
  let totalMax = 0;
  let totalAbsentCount = 0;
  let semPaperCount = 0;

  (s.marks || [])
    .filter((m) => (m.course?.semester ?? m.semester ?? 1) === selectedSemester)
    .forEach((m) => {
      semPaperCount++;
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      if (isAbsent) {
        totalAbsentCount++;
        if (m.courseId) courseMarksById[m.courseId] = "A";
        if (m.course?.id) courseMarksById[m.course.id] = "A";
        if (m.course?.title) courseMarksByTitle[m.course.title.trim().toLowerCase()] = "A";
      } else {
        if (m.courseId) courseMarksById[m.courseId] = m.obtainedMarks;
        if (m.course?.id) courseMarksById[m.course.id] = m.obtainedMarks;
        if (m.course?.title) {
          courseMarksByTitle[m.course.title.trim().toLowerCase()] = m.obtainedMarks;
        }
        totalObtained += m.obtainedMarks;
      }
      totalMax += m.totalMarks;
    });

  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  let grade = "—";
  if (totalMax > 0) {
    if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
      grade = "F (A)";
    } else if (gpa < 1.00) {
      grade = "F";
    } else {
      grade = getGrade(gpa, pct);
    }
  }

  // Per-semester promotion logic based on university rules:
  let status = "PROMOTED";
  if (totalMax === 0) {
    status = "—";
  } else if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
    status = "ABSENT";
  } else if (selectedSemester === 1) {
    if (gpa >= 1.00) status = "PROMOTED";
    else status = "DROPOUT";
  } else if (selectedSemester === 2) {
    if (cgpa >= 1.50) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  } else if (selectedSemester === 3) {
    if (cgpa >= 1.75) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  } else {
    // Semesters 4 to 8
    if (cgpa >= 2.00) status = "PROMOTED";
    else if (cgpa >= 1.00) status = "PROBATION";
    else status = "DROPOUT";
  }

  // Cumulative Marks & Credit Hours up to current selected semester
  let cumObtained = 0;
  let cumMax = 0;
  let cumCredits = 0;

  (s.marks || [])
    .filter((m) => {
      const sem = m.course?.semester ?? m.semester ?? 1;
      if (s.bsAdmissionType === "BRIDGING_5TH") {
        return sem >= 5 && sem <= selectedSemester;
      }
      return sem >= 1 && sem <= selectedSemester;
    })
    .forEach((m) => {
      const isAbsent = (m as any).status === "ABSENT" || (m as any).status === "A";
      if (!isAbsent) cumObtained += m.obtainedMarks;
      cumMax += m.totalMarks;
      cumCredits += m.course?.creditHours || 3;
    });

  // Serialized / numbered failed papers: "1. Math, 2. Physics"
  let remarks = "Passed";
  if (totalMax === 0) {
    remarks = "—";
  } else if (totalAbsentCount > 0 && totalAbsentCount === semPaperCount) {
    remarks = "Absent in all Exam Papers (A)";
  } else if (failedCourses.length > 0) {
    const serializedFailed = failedCourses.map((c, i) => `${i + 1}. ${c.title}`).join(", ");
    remarks = `Failed in ${failedCourses.length} Paper(s): ${serializedFailed}`;
  }

  return {
    gpa,
    cgpa,
    status,
    grade,
    pct,
    totalObtained,
    totalMax,
    totalAbsentCount,
    semPaperCount,
    courseMarksById,
    courseMarksByTitle,
    failedCourses,
    remarks,
    cumObtained,
    cumMax,
    cumCredits,
  };
}

type ProgramSessionGroup = {
  programId: string;
  programName: string;
  session: string;
  students: StudentData[];
  courses: Array<{ id?: string; title: string; code?: string; creditHours: number }>;
  courseMaxMarks: Record<string, number>;
  grandTotalMax: number;
  theme: ReturnType<typeof getProgramColor>;
};

export default function GazetteCompilerPage() {
  const { collegeName, collegeLogo, collegeTagline, settings } = useSettings();

  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedProgram, setSelectedProgram] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleStudentExpand = (id: string) => {
    setExpandedRemarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllRemarks = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    if (nextState) {
      const map: Record<string, boolean> = {};
      allStudents.forEach((s) => {
        map[s.id] = true;
      });
      setExpandedRemarks(map);
    } else {
      setExpandedRemarks({});
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = (ids: string[]) =>
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));

  // Fetch BS programs and distinct sessions on load
  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setPrograms(data.filter((p: Program) => p.educationLevel === "BS"));
      });

    // Extract sessions from database students
    fetch("/api/students?educationLevel=BS")
      .then((r) => r.json())
      .then(async (data) => {
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (Array.isArray(data)) {
          const dbSessions = Array.from(new Set(data.map((s: any) => s.session).filter(Boolean))) as string[];
          const settingSessions = settings.ACADEMIC_SESSIONS
            ? settings.ACADEMIC_SESSIONS.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
          const combined = filterValidSessions([...dbSessions, ...settingSessions, ...DEFAULT_ALL_SESSIONS]).sort().reverse();
          setSessionOptions(combined);
        }
      });
  }, [settings.ACADEMIC_SESSIONS]);

  // Fetch students whenever filters change — API handles educationLevel, session, programId
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ educationLevel: "BS" });
    if (selectedSession !== "ALL") params.set("session", selectedSession);
    if (selectedProgram !== "ALL") params.set("programId", selectedProgram);

    fetch(`/api/students?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          let list = data;
          if (selectedSession !== "ALL") {
            list = data.filter((s: StudentData) => {
              if (!s.session) return false;
              const sSess = s.session.toLowerCase().trim();
              const target = selectedSession.toLowerCase().trim();
              return sSess === target || sSess.includes(target) || target.includes(sSess);
            });
          }
          setAllStudents(list);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedSession, selectedProgram]);

  // Standard semesters 1-8
  const standardSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const detectedSemesters = Array.from(
    new Set(
      allStudents.flatMap((s) => (s.marks || []).map((m) => m.course?.semester ?? m.semester ?? 1))
    )
  ).sort((a, b) => a - b);

  const semesterOptions = Array.from(new Set([...standardSemesters, ...detectedSemesters])).sort((a, b) => a - b);

  // Group students by Program & Session so each program has its own dedicated official table
  const programSessionGroups: ProgramSessionGroup[] = [];
  const groupMap = new Map<string, ProgramSessionGroup>();

  allStudents.forEach((s) => {
    const progId = s.programId || "unknown";
    const progName = s.program?.name || (programs.find((p) => p.id === progId)?.name) || "General BS";
    const sess = s.session || "2025";
    const groupKey = `${progId}__${sess}`;

    if (!groupMap.has(groupKey)) {
      const group: ProgramSessionGroup = {
        programId: progId,
        programName: progName,
        session: sess,
        students: [],
        courses: [],
        courseMaxMarks: {},
        grandTotalMax: 0,
        theme: getProgramColor(progName),
      };
      groupMap.set(groupKey, group);
      programSessionGroups.push(group);
    }

    groupMap.get(groupKey)!.students.push(s);
  });

  // For each group, extract only its specific courses for the selected semester
  programSessionGroups.forEach((group) => {
    const seenTitles = new Set<string>();
    group.students.forEach((s) => {
      (s.marks || [])
        .filter((m) => (m.course?.semester ?? m.semester ?? 1) === selectedSemester)
        .forEach((m) => {
          const t = m.course?.title || "Subject";
          if (!seenTitles.has(t)) {
            seenTitles.add(t);
            group.courses.push({
              id: m.course?.id,
              title: t,
              code: m.course?.code,
              creditHours: m.course?.creditHours || 3,
            });
          }
          if (!group.courseMaxMarks[t] || m.totalMarks > group.courseMaxMarks[t]) {
            group.courseMaxMarks[t] = m.totalMarks;
          }
        });
    });

    group.courses.sort((a, b) => a.title.localeCompare(b.title));
    group.grandTotalMax = group.courses.reduce((sum, c) => sum + (group.courseMaxMarks[c.title] || 0), 0);
  });

  return (
    <div className="space-y-8 font-sans">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          th, td { font-size: 8px !important; padding: 3px 4px !important; }
          .gazette-section { page-break-after: always; margin-bottom: 20px; }
          .gazette-section:last-child { page-break-after: avoid; }
        }
      `}</style>

      {/* Page Header (Web only) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Results Gazette</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Program-wise structured results gazette compiled for semesters and batches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAllRemarks}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold border border-slate-300 transition-all flex items-center gap-2 shadow-xs"
            title="Expand or Collapse failed papers in all student rows"
          >
            <span>{allExpanded ? "🔼 Collapse All Papers" : "🔽 Expand All Papers"}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            🖨️ Print Gazette
          </button>
        </div>
      </div>

      {/* Filters (Web only) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex flex-wrap gap-5 items-end">
          {/* Semester */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[150px]"
            >
              {semesterOptions.map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[160px]"
            >
              <option value="ALL">All Sessions</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 min-w-[200px]"
            >
              <option value="ALL">All Programs (Grouped Gazette)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!loading && (
            <div className="ml-auto flex items-center gap-2 self-end">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                {allStudents.length} total student(s)
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold">
                {programSessionGroups.length} program section(s)
              </span>
              {selectedIds.length > 0 && (
                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Compiling Program Gazettes...</p>
        </div>
      ) : programSessionGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
            No students found for the selected filters
          </p>
        </div>
      ) : (
        /* Render each Program & Session as its own dedicated section */
        programSessionGroups.map((group, groupIdx) => {
          const { programName, session, students, courses, courseMaxMarks, grandTotalMax, theme } = group;

          return (
            <div key={`${group.programId}-${session}-${groupIdx}`} className="gazette-section space-y-4">
              {/* Official Print & Web Section Banner */}
              <div className={`rounded-2xl p-5 bg-gradient-to-r ${theme.bannerBg} text-white shadow-md border flex flex-wrap items-center justify-between gap-4 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900 print:p-2 print:rounded-none print:shadow-none print:mb-3`}>
                <div className="flex items-center gap-3">
                  {collegeLogo ? (
                    <img src={collegeLogo} alt="Logo" className="w-11 h-11 object-contain print:w-10 print:h-10" />
                  ) : (
                    <div className="w-3.5 h-8 rounded-full bg-blue-500 print:hidden" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black tracking-wide uppercase print:text-sm">{programName}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${theme.badgeBg}`}>
                        Session: {session}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 print:bg-slate-100 print:text-slate-800">
                        Semester {selectedSemester}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5 print:text-slate-600 print:text-[9px]">
                      {collegeName} &nbsp;|&nbsp; {students.length} Student(s) &nbsp;|&nbsp; {courses.length} Exam Paper(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <span className="text-xs font-bold text-slate-300">Total Marks (Sem):</span>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black text-white border border-white/20">
                    {grandTotalMax || 0}
                  </span>
                </div>
              </div>

              {/* Dedicated Table for this Program & Session */}
              <div className="bg-white rounded-2xl print:rounded-none shadow-sm print:shadow-none border border-slate-200 print:border-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900">
                        <th rowSpan={2} className="px-3 py-3 w-10 text-center align-middle border-r border-slate-700 print:border-slate-300 print:hidden">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                            checked={students.every((s) => selectedIds.includes(s.id)) && students.length > 0}
                            onChange={() => {
                              const groupStudentIds = students.map((s) => s.id);
                              const allSelected = groupStudentIds.every((id) => selectedIds.includes(id));
                              if (allSelected) {
                                setSelectedIds((prev) => prev.filter((id) => !groupStudentIds.includes(id)));
                              } else {
                                setSelectedIds((prev) => Array.from(new Set([...prev, ...groupStudentIds])));
                              }
                            }}
                          />
                        </th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider text-center align-middle border-r border-slate-700 print:border-slate-300">#</th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider align-middle border-r border-slate-700 print:border-slate-300">Roll No</th>
                        <th rowSpan={2} className="px-4 py-3 font-black uppercase text-[10px] tracking-wider align-middle border-r border-slate-700 print:border-slate-300">Name</th>

                        {/* Program-specific Papers */}
                        {courses.map((course, i) => (
                          <th
                            key={`hdr-${group.programId}-${course.title}-${i}`}
                            className={`px-3 py-2 font-black uppercase text-[9px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 transition-colors ${theme.headerBg}`}
                            title={`${course.title} ${course.code ? `(${course.code})` : ""}`}
                          >
                            <div className="font-black text-[10px]">Paper {i + 1}</div>
                            <div className="font-semibold text-slate-200 print:text-slate-700 text-[8.5px] truncate max-w-[85px] mx-auto">
                              {course.title.length > 18 ? course.title.slice(0, 16) + "…" : course.title}
                            </div>
                            <div className="text-slate-400 print:text-slate-500 text-[8px]">
                              / {courseMaxMarks[course.title] ?? "—"}
                            </div>
                          </th>
                        ))}

                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle bg-slate-800 print:bg-slate-200 whitespace-nowrap">
                          Total<br />
                          <span className="text-slate-400 text-[8px] font-semibold">
                            out of {grandTotalMax || "—"}
                          </span>
                        </th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">%age</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">GPA</th>
                        {selectedSemester > 1 && (
                          <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">CGPA</th>
                        )}
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Grade</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle bg-slate-800 print:bg-slate-200 whitespace-nowrap">
                          Overall Total &amp; Cr. Hrs<br />
                          <span className="text-slate-400 text-[8px] font-semibold">
                            (Sem 1 to {selectedSemester})
                          </span>
                        </th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Status</th>
                        <th rowSpan={2} className="px-3 py-3 font-black uppercase text-[10px] tracking-wider text-center border-l border-slate-700 print:border-slate-300 align-middle">Remarks</th>
                      </tr>
                      {/* Empty second row for rowspan alignment */}
                      <tr className="bg-slate-800 print:bg-slate-50 h-0">
                        {courses.map((c, i) => <th key={`sp-${group.programId}-${c.title}-${i}`} className="p-0 border-none"></th>)}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {students.map((s, idx) => {
                        const {
                          gpa,
                          cgpa,
                          status,
                          grade,
                          pct,
                          totalObtained,
                          totalMax,
                          totalAbsentCount,
                          semPaperCount,
                          courseMarksById,
                          courseMarksByTitle,
                          failedCourses,
                          remarks,
                          cumObtained,
                          cumMax,
                        } = buildStudentResults(s, selectedSemester);
                        const isAllPass = failedCourses.length === 0;

                        return (
                          <tr
                            key={s.id}
                            className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} ${
                              selectedIds.includes(s.id) ? "!bg-blue-50" : ""
                            } hover:bg-blue-50/30 transition-colors`}
                          >
                            <td className="px-3 py-2.5 text-center border-r border-slate-100 print:border-slate-300 print:hidden">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                checked={selectedIds.includes(s.id)}
                                onChange={() => toggleSelect(s.id)}
                              />
                            </td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-400 text-center border-r border-slate-100 print:border-slate-300">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-700 border-r border-slate-100 print:border-slate-300 whitespace-nowrap text-xs">{s.rollNumber}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100 print:border-slate-300 whitespace-nowrap text-xs">{s.user?.name}</td>

                            {courses.map((course) => {
                              const obtained = (course.id && courseMarksById[course.id] !== undefined)
                                ? courseMarksById[course.id]
                                : courseMarksByTitle[course.title.trim().toLowerCase()];
                              const isAbsentPaper = obtained === "A";
                              const maxMark = courseMaxMarks[course.title] || 0;
                              const paperPct = !isAbsentPaper && maxMark > 0 && typeof obtained === "number" ? (obtained / maxMark) * 100 : -1;
                              const isFail = isAbsentPaper || (paperPct >= 0 && paperPct < 50);
                              return (
                                <td
                                  key={`${s.id}-${course.title}`}
                                  className={`px-3 py-2.5 text-center font-bold text-xs border-l border-slate-100 print:border-slate-300 ${
                                    isAbsentPaper
                                      ? "text-rose-700 bg-rose-50/70 font-black print:text-rose-900"
                                      : isFail
                                      ? "text-rose-600 bg-rose-50/40 print:bg-transparent"
                                      : obtained !== undefined
                                      ? "text-slate-800"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {isAbsentPaper ? (
                                    <span className="px-1.5 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 rounded font-black text-[11px]">
                                      A
                                    </span>
                                  ) : obtained !== undefined ? (
                                    obtained
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              );
                            })}

                            <td className="px-3 py-2.5 text-center font-bold text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs whitespace-nowrap">
                              {totalMax === 0 ? "—" : totalAbsentCount > 0 && totalAbsentCount === semPaperCount ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 rounded font-black text-xs">
                                  A
                                </span>
                              ) : (
                                totalObtained
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 border-l border-slate-100 print:border-slate-300 text-xs">
                              {totalMax > 0 ? pct.toFixed(1) : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 border-l border-slate-100 print:border-slate-300 text-xs">
                              {gpa.toFixed(2)}
                            </td>
                            {selectedSemester > 1 && (
                              <td className="px-3 py-2.5 text-center font-black text-blue-700 border-l border-slate-100 print:border-slate-300 bg-blue-50/20 print:bg-transparent text-xs">
                                {cgpa.toFixed(2)}
                              </td>
                            )}
                            <td className="px-3 py-2.5 text-center font-black text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs">
                              {grade}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-800 border-l border-slate-100 print:border-slate-300 text-xs whitespace-nowrap">
                              {cumMax > 0 ? (
                                <span>
                                  {cumObtained}{" "}
                                  <span className="text-slate-400 text-[10px] font-normal">/ {cumMax}</span>
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center border-l border-slate-100 print:border-slate-300">
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                                status === "PROMOTED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 print:border-none print:p-0"
                                  : status === "PROBATION"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 print:border-none print:p-0"
                                  : status === "DROPOUT"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 print:border-none print:p-0"
                                  : "bg-slate-100 text-slate-600 border-slate-200 print:border-none print:p-0"
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs font-semibold border-l border-slate-100 print:border-slate-300 align-middle">
                              {isAllPass ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                                  <span className="text-emerald-500 font-bold">✓</span> Passed
                                </span>
                              ) : (
                                (() => {
                                  const isDropout = status === "DROPOUT";
                                  const isAbsent = status === "ABSENT";
                                  const isRed = isDropout || isAbsent;

                                  // Promoted / Probation with failed papers in Orange (amber), Dropout / Absent in Red (rose)
                                  const colorScheme = isRed
                                    ? {
                                        btnBg: "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300",
                                        headerText: "text-rose-700",
                                        numColor: "text-rose-800",
                                        linkColor: "text-rose-700 hover:text-rose-900",
                                        borderColor: "border-rose-200",
                                        dotColor: "bg-rose-500",
                                      }
                                    : {
                                        btnBg: "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300",
                                        headerText: "text-amber-800",
                                        numColor: "text-amber-900",
                                        linkColor: "text-amber-700 hover:text-amber-950",
                                        borderColor: "border-amber-200",
                                        dotColor: "bg-amber-500",
                                      };

                                  const isExpanded = Boolean(expandedRemarks[s.id]);

                                  return (
                                    <div className="min-w-[155px]">
                                      {/* Uniform height collapse/expand button to keep all rows same height */}
                                      <button
                                        type="button"
                                        onClick={() => toggleStudentExpand(s.id)}
                                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all flex items-center justify-between w-full shadow-xs ${colorScheme.btnBg} print:hidden`}
                                        title="Click to Expand / Collapse Failed Papers"
                                      >
                                        <span className="flex items-center gap-1.5 truncate">
                                          <span className={`w-1.5 h-1.5 rounded-full ${colorScheme.dotColor}`}></span>
                                          <span>Failed in {failedCourses.length} Paper{failedCourses.length > 1 ? "s" : ""}</span>
                                        </span>
                                        <span className="text-[9px] font-mono ml-1 shrink-0 opacity-80">
                                          {isExpanded ? "▲" : "▼"}
                                        </span>
                                      </button>

                                      {/* Expanded paper details (or print view) */}
                                      <div className={`${isExpanded ? "block mt-1.5 pt-1.5 border-t " + colorScheme.borderColor : "hidden"} print:block print:border-none print:p-0`}>
                                        <div className={`font-bold text-[9px] mb-1 ${colorScheme.headerText} hidden print:block`}>
                                          Failed in {failedCourses.length} Paper(s):
                                        </div>
                                        <div className="space-y-1 text-[10px]">
                                          {failedCourses.map((c, i) => {
                                            const targetUrl = c.id
                                              ? `/bs/marks?courseId=${c.id}&programId=${c.programId || s.programId || ""}&semester=${selectedSemester}&session=${s.session || ""}`
                                              : `/bs/marks?courseTitle=${encodeURIComponent(c.title)}&programId=${s.programId || ""}&semester=${selectedSemester}&session=${s.session || ""}`;

                                            return (
                                              <div key={i} className="flex items-center gap-1">
                                                <span className={`font-black ${colorScheme.numColor}`}>{i + 1}.</span>
                                                <a
                                                  href={targetUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title={`Click to enter/edit marks for ${c.title}`}
                                                  className={`${colorScheme.linkColor} hover:underline font-semibold transition-colors inline-flex items-center gap-0.5 group print:no-underline print:text-slate-800`}
                                                >
                                                  <span>{c.title}</span>
                                                  <span className="text-[9px] opacity-60 group-hover:opacity-100 font-mono print:hidden">↗</span>
                                                </a>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Print Footer per Program */}
                <div className="hidden print:flex mt-8 p-4 justify-between items-end text-[9px] font-bold text-slate-800 uppercase tracking-widest border-t border-slate-300">
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Prepared By (Clerk)
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Controller of Examinations
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-800 mb-1"></div>
                    Principal Signature
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
