"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ExamsResultsPage() {
  const [activeTab, setActiveTab] = useState("marks");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Examinations & Results</h1>
        <p className="text-gray-500 mt-1">Manage Marks Entry, Result Compilation, and Student Promotions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
        <div className="flex border-b print:hidden">
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'marks' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('marks')}
          >
            Marks Entry
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('results')}
          >
            Results & Promotion
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'academic_actions' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('academic_actions')}
          >
            🔀 Status & Academic Actions
          </button>
          <button
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'merit' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
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

          {activeTab === 'academic_actions' && (
            <StatusAcademicActionsTab />
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
  const { data: session } = useSession();
  const [entryType, setEntryType] = useState<"detailed" | "total">("detailed");

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([
    "2024-2028", "2025-2029", "2026-2030", "2023-2027", "2022-2026",
    "2024-2026", "2025-2027", "2026-2028", "2023-2025", "2022-2024"
  ]);
  const [selectedProgType, setSelectedProgType] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState("2024-2028");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("2");
  const [selectedCourse, setSelectedCourse] = useState("");

  const [courseTotalMarks, setCourseTotalMarks] = useState(100);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Approval & Lock Lifecycle state
  const [resultStatus, setResultStatus] = useState<"SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "UNLOCK_REQUESTED" | "UNLOCKED_FOR_EDIT">("SAVED");
  const [isLocked, setIsLocked] = useState(false);

  // Live Metrics & Unlock Request State
  const [metricCounts, setMetricCounts] = useState({ saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
  const [unlockRequestsList, setUnlockRequestsList] = useState<any[]>([]);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [submittingUnlockReq, setSubmittingUnlockReq] = useState(false);

  const userRole = (session?.user as any)?.role || "";
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(userRole);
  const isFacultyLocked = isLocked && !isAdmin && resultStatus !== "UNLOCKED_FOR_EDIT";

  const loadMetrics = () => {
    fetch("/api/marks/unlock-request")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMetricCounts(data.counts || { saved: 0, pending: 0, unlockRequested: 0, approved: 0 });
          setUnlockRequestsList(data.summaryList || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Load programs & courses & settings from API with smart auto-selection for Faculty
  useEffect(() => {
    Promise.all([
      fetch("/api/programs").then(r => r.ok ? r.json() : []),
      fetch("/api/courses").then(r => r.ok ? r.json() : []),
      fetch("/api/settings").then(r => r.ok ? r.json() : {})
    ]).then(async ([pData, cData, sData]) => {
      const validProgs = Array.isArray(pData) ? pData.filter((p: any) => p.educationLevel === "BS" || !p.educationLevel) : [];
      const validCourses = Array.isArray(cData) ? cData : [];

      const settingsObj = (sData as any) || {};
      if (settingsObj.ACADEMIC_SESSIONS) {
        const { filterValidSessions } = await import("@/lib/sessionHelper");
        const validList = filterValidSessions(settingsObj.ACADEMIC_SESSIONS);
        setSessions(validList);
        if (validList.length > 0 && !validList.includes(selectedSession)) {
          setSelectedSession(validList[0]);
        }
      }

      setPrograms(validProgs);
      setCourses(validCourses);

      const userEmail = session?.user?.email;
      const facultyAssignedCourse = validCourses.find((c: any) =>
        c.faculty?.user?.email && userEmail && c.faculty.user.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (facultyAssignedCourse) {
        setSelectedProgram(facultyAssignedCourse.programId);
        setSelectedSemester(facultyAssignedCourse.semester?.toString() || "1");
        setSelectedCourse(facultyAssignedCourse.id);
        const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
        setCourseTotalMarks(totals[facultyAssignedCourse.creditHours] ?? 100);
      } else if (validProgs.length > 0) {
        const firstProgId = validProgs[0].id;
        setSelectedProgram(firstProgId);
        const firstProgCourses = validCourses.filter((c: any) => c.programId === firstProgId);
        if (firstProgCourses.length > 0) {
          setSelectedSemester(firstProgCourses[0].semester?.toString() || "1");
          setSelectedCourse(firstProgCourses[0].id);
        }
      }
    }).catch(() => {});
  }, [session?.user?.email]);

  // Available courses filtered by program and semester
  const filteredCourses = courses.filter(c => {
    if (selectedProgram && c.programId !== selectedProgram) return false;
    if (selectedSemester && c.semester !== parseInt(selectedSemester)) return false;
    return true;
  });

  // Auto-switch course if selectedProgram / selectedSemester changes and current course is invalid
  useEffect(() => {
    if (filteredCourses.length > 0 && !filteredCourses.some(c => c.id === selectedCourse)) {
      handleCourseChange(filteredCourses[0].id);
    }
  }, [selectedProgram, selectedSemester, courses]);

  // When course changes → auto-fill total marks from course creditHours
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSuccessMsg("");
    setErrorMsg("");
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const totals: Record<number, number> = { 1: 33, 2: 67, 3: 100, 4: 100 };
      setCourseTotalMarks(totals[course.creditHours] ?? 100);
    }
  };

  // Datesheet Exam Scheme state (MID_FINAL vs TERMINAL scheme)
  const [datesheetInfo, setDatesheetInfo] = useState<any>(null);
  const [examScheme, setExamScheme] = useState<"MID_FINAL" | "TERMINAL">("MID_FINAL");

  // Fetch real students & existing marks when program & course are selected
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setResultStatus("SAVED");
      setIsLocked(false);
      setDatesheetInfo(null);
      return;
    }

    setLoading(true);
    const queryParams = new URLSearchParams();
    queryParams.set("educationLevel", "BS");
    if (selectedProgram) queryParams.set("programId", selectedProgram);

    Promise.all([
      fetch(`/api/students?${queryParams}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/marks?courseId=${selectedCourse}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/datesheet?courseId=${selectedCourse}`, { cache: "no-store" }).then(r => r.ok ? r.json() : [])
    ]).then(([sData, mData, dsData]) => {
      const studentList = Array.isArray(sData) ? sData : [];
      const marksArr = Array.isArray(mData) ? mData : [];

      // Auto-detect exam scheme from Datesheet if available
      const dsArr = Array.isArray(dsData) ? dsData : [];
      if (dsArr.length > 0) {
        const latestDs = dsArr[0];
        setDatesheetInfo(latestDs);
        if (latestDs.examType === "TERMINAL" || latestDs.examType === "TERMINAL_EXAM") {
          setExamScheme("TERMINAL");
        } else if (latestDs.examType === "MID_TERM" || latestDs.examType === "FINAL_TERM") {
          setExamScheme("MID_FINAL");
        }
      } else {
        setDatesheetInfo(null);
      }

      if (marksArr.length > 0) {
        setResultStatus(marksArr[0].status || "SAVED");
        setIsLocked(Boolean(marksArr[0].isLocked));
      } else {
        setResultStatus("SAVED");
        setIsLocked(false);
      }

      const mapped = studentList.map((st: any) => {
        const existing = marksArr.find((m: any) => m.studentId === st.id);
        return {
          id: st.id,
          name: st.user?.name || st.name || "Student",
          roll: st.rollNumber || st.roll || "N/A",
          bsAdmissionType: st.bsAdmissionType || "REGULAR",
          assignment: existing?.assignmentMarks || 0,
          quiz: existing?.quizMarks || 0,
          practical: existing?.practicalMarks || 0,
          mid: existing?.midtermMarks || 0,
          final: existing?.finalMarks || 0,
          totalOnly: existing?.obtainedMarks || 0,
        };
      });

      setStudents(mapped);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCourse, selectedProgram]);

  const currentSelectedCourse = courses.find((c: any) => c.id === selectedCourse);
  const isPracticalCourse = Boolean(
    currentSelectedCourse && (
      (currentSelectedCourse.creditHoursFormat && currentSelectedCourse.creditHoursFormat.includes("-1")) ||
      (currentSelectedCourse.labHours && currentSelectedCourse.labHours > 0) ||
      currentSelectedCourse.courseType === "LAB_PRACTICAL" ||
      currentSelectedCourse.courseType === "PRACTICAL" ||
      (currentSelectedCourse.code && currentSelectedCourse.code.toLowerCase().includes("lab"))
    )
  );

  const handleMarkChange = (id: string, field: string, value: string) => {
    if (isFacultyLocked) return;
    const numValue = parseFloat(value) || 0;
    const student = students.find(s => s.id === id);
    if (!student) return;

    const totalQuizAssignLimit = examScheme === "TERMINAL"
      ? (isPracticalCourse ? 5 : 30)
      : (isPracticalCourse ? 15 : 30);

    if (field === "assignment") {
      const remainingForAssign = Math.max(0, totalQuizAssignLimit - student.quiz);
      if (student.quiz >= totalQuizAssignLimit && numValue > 0) {
        alert(`Quiz already has ${student.quiz}/${totalQuizAssignLimit} marks! Assignment is auto-blocked.`);
        return;
      }
      if (numValue > remainingForAssign) {
        alert(`Combined Assignment + Quiz marks cannot exceed ${totalQuizAssignLimit}! Current Quiz is ${student.quiz}, so Assignment max allowed is ${remainingForAssign}.`);
        return;
      }
    }

    if (field === "quiz") {
      const remainingForQuiz = Math.max(0, totalQuizAssignLimit - student.assignment);
      if (student.assignment >= totalQuizAssignLimit && numValue > 0) {
        alert(`Assignment already has ${student.assignment}/${totalQuizAssignLimit} marks! Quiz is auto-blocked.`);
        return;
      }
      if (numValue > remainingForQuiz) {
        alert(`Combined Assignment + Quiz marks cannot exceed ${totalQuizAssignLimit}! Current Assignment is ${student.assignment}, so Quiz max allowed is ${remainingForQuiz}.`);
        return;
      }
    }

    if (examScheme === "TERMINAL") {
      // ── TERMINAL EXAM SCHEME (Datesheet Decided: Single 70 Terminal Paper) ──
      if (isPracticalCourse) {
        if (field === "practical" && numValue > 25) {
          alert("Practical marks cannot exceed 25!");
          return;
        }
        if (field === "final" && numValue > 70) {
          alert("Terminal Exam marks cannot exceed 70!");
          return;
        }
      } else {
        if (field === "final" && numValue > 70) {
          alert("Terminal Exam marks cannot exceed 70!");
          return;
        }
      }
    } else {
      // ── MID + FINAL SCHEME (Mid 30/20 + Final 40) ──
      if (isPracticalCourse) {
        if (field === "practical" && numValue > 25) {
          alert("Practical marks cannot exceed 25 for 4(3-1) credit course!");
          return;
        }
        if (field === "mid" && numValue > 20) {
          alert("Midterm marks cannot exceed 20 for 4(3-1) credit course!");
          return;
        }
        if (field === "final" && numValue > 40) {
          alert("Final Term marks cannot exceed 40!");
          return;
        }
      } else {
        if (field === "mid" && numValue > 30) {
          alert("Midterm marks cannot exceed 30!");
          return;
        }
        if (field === "final" && numValue > 40) {
          alert("Final Term marks cannot exceed 40!");
          return;
        }
      }
    }

    setStudents(students.map(s => s.id === id ? { ...s, [field]: numValue } : s));
  };

  const getComputed = (s: any) =>
    entryType === "detailed"
      ? s.assignment + s.quiz + (isPracticalCourse ? (s.practical || 0) : 0) + (examScheme === "TERMINAL" ? 0 : s.mid) + s.final
      : s.totalOnly;

  const handleSaveWithStatus = async (targetStatus: "SAVED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED", lockTarget?: boolean) => {
    if (!selectedCourse) {
      alert("Please select a Course first!");
      return;
    }
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const lockVal = lockTarget !== undefined ? lockTarget : (targetStatus === "APPROVED");

    let successCount = 0;
    let lastError = "";
    for (const s of students) {
      try {
        const res = await fetch("/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: s.id,
            courseId: selectedCourse,
            assignmentMarks: s.assignment,
            quizMarks: s.quiz,
            practicalMarks: isPracticalCourse ? s.practical : 0,
            midtermMarks: s.mid,
            finalMarks: s.final,
            totalMarks: courseTotalMarks,
            status: targetStatus,
            isLocked: lockVal,
          })
        });
        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || "Server error";
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    setSaving(false);
    if (successCount > 0) {
      setResultStatus(targetStatus);
      setIsLocked(lockVal);
      loadMetrics();
      if (targetStatus === "SAVED") {
        setSuccessMsg("💾 Marks saved as Draft!");
      } else if (targetStatus === "PENDING_APPROVAL") {
        setSuccessMsg("🚀 Result published & submitted for Admin Approval!");
      } else if (targetStatus === "APPROVED") {
        setSuccessMsg("✅ Result approved & locked for Faculty!");
      } else if (targetStatus === "REJECTED") {
        setSuccessMsg("🔓 Result unlocked & returned to Faculty for editing.");
      }
    } else {
      setErrorMsg(lastError ? `Failed to save marks: ${lastError}` : "Failed to update result status. Please try again.");
    }
  };

  // Submit Unlock Request (Faculty)
  const handleRequestUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim()) return alert("Please specify the reason for edit request.");
    setSubmittingUnlockReq(true);
    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, reason: unlockReason })
      });
      const data = await res.json();
      if (res.ok) {
        setResultStatus("UNLOCK_REQUESTED");
        if (typeof window !== "undefined") sessionStorage.setItem("req_sent_" + selectedCourse, "true");
        setSuccessMsg("📩 Edit Request sent to Admin! Reason: " + unlockReason);
        setUnlockModalOpen(false);
        setUnlockReason("");
        loadMetrics();
      } else {
        setErrorMsg(data.error || "Failed to submit unlock request");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setSubmittingUnlockReq(false);
  };

  // Admin Approve / Reject Unlock Request
  const handleAdminProcessUnlock = async (cId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: cId, action })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        loadMetrics();
        if (cId === selectedCourse) {
          if (action === "APPROVE") {
            setIsLocked(false);
            setResultStatus("UNLOCKED_FOR_EDIT");
          } else {
            setResultStatus("APPROVED");
            setIsLocked(true);
          }
        }
      } else {
        setErrorMsg(data.error || "Failed to process request");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredStudentsList = students.filter(st => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = st.name.toLowerCase().includes(q);
      const matchRoll = st.roll.toLowerCase().includes(q);
      if (!matchName && !matchRoll) return false;
    }

    // Program type filter
    if (selectedProgType === "ALL") return true;
    if (selectedProgType === "REGULAR") return st.bsAdmissionType === "REGULAR" || !st.bsAdmissionType;
    if (selectedProgType === "BRIDGING") return st.bsAdmissionType === "BRIDGING_5TH";
    if (selectedProgType === "MIGRATION") return st.bsAdmissionType === "MIGRATION";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Enter & Review Student Marks</h2>
          <p className="text-xs text-gray-500">Select program and course to manage student evaluation & result approvals.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedCourse && (
            <div>
              {resultStatus === "APPROVED" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-green-100 text-green-800 border border-green-300 flex items-center gap-1.5 shadow-sm">
                  <span>🔒</span> APPROVED & PUBLISHED (LOCKED)
                </span>
              ) : resultStatus === "PENDING_APPROVAL" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse shadow-sm">
                  <span>⏳</span> PENDING ADMIN APPROVAL
                </span>
              ) : resultStatus === "REJECTED" ? (
                <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shadow-sm">
                  <span>❌</span> REJECTED - REVISION NEEDED
                </span>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-sm">
                  <span>📝</span> DRAFT / SAVED
                </span>
              )}
            </div>
          )}

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
      </div>

      {/* Search & Filters row */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Search Student</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="🔍 Search name or roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program Type</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              value={selectedProgType}
              onChange={e => setSelectedProgType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">BS Regular</option>
              <option value="BRIDGING">BS 5th / Bridging</option>
              <option value="MIGRATION">Migration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
            >
              <option value="">-- Session --</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              value={selectedProgram}
              onChange={e => {
                setSelectedProgram(e.target.value);
                setSelectedCourse("");
              }}
            >
              <option value="">-- Select Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
            <select
              className="w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400"
              value={selectedSemester}
              onChange={e => {
                setSelectedSemester(e.target.value);
                setSelectedCourse("");
              }}
            >
              <option value="">-- Select Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Course *</label>
          <select
            className={`w-full px-4 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-400 ${!selectedProgram ? 'opacity-60 cursor-not-allowed' : ''}`}
            value={selectedCourse}
            onChange={e => handleCourseChange(e.target.value)}
          >
            <option value="">-- Select Course --</option>
            {filteredCourses.map(c => {
              const creditFmt = c.creditHoursFormat || (c.labHours && c.labHours > 0 ? `${c.creditHours}(${c.theoryHours || c.creditHours - c.labHours}-${c.labHours})` : `${c.creditHours}(${c.creditHours}-0)`);
              return (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code}) — {creditFmt} Cr
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {successMsg && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 font-medium">{successMsg}</div>}
      {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 font-medium">{errorMsg}</div>}

      {!selectedProgram || !selectedCourse ? (
        <div className="bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 p-8 rounded-xl text-center space-y-3 shadow-sm">
          <div className="text-4xl">⚠️</div>
          <h3 className="font-bold text-lg">Program & Course Selection Required</h3>
          <p className="text-sm text-amber-800 max-w-md mx-auto">
            {!selectedProgram
              ? "Please select a Program, Semester, and Course from the filters above to load enrolled students and enter marks."
              : "Please select a Course from the dropdown above to start entering student marks."}
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">⏳ Loading students and marks data...</div>
      ) : (
        <>
          {isFacultyLocked && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 p-4 rounded-xl flex items-center justify-between shadow-sm flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h4 className="text-sm font-bold">Result is Approved & Published by Admin. Marks are locked and cannot be edited by Faculty.</h4>
                  <p className="text-xs text-amber-800">If you need to make changes, send an unlock request to Admin with your reason.</p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow transition-all"
              >
                📩 Request Unlock / Edit Permission
              </button>
            </div>
          )}

          {resultStatus === "UNLOCK_REQUESTED" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-900 font-semibold shadow-sm">
              <span className="text-2xl">⏳</span>
              <div>
                <strong className="block font-extrabold text-blue-950 text-sm">Unlock Request Submitted</strong>
                Your request to edit marks is pending Admin approval. As soon as Admin approves, marks will unlock automatically.
              </div>
            </div>
          )}

          {/* Exam Scheme Mode Card (Decided by Datesheet) */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-xl border border-purple-200 flex items-center justify-between flex-wrap gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Exam Scheme Mode (Decided by Datesheet):</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <strong className="text-xs font-black text-gray-900">
                    {examScheme === "TERMINAL"
                      ? `🎓 Single Terminal Exam Scheme — ${isPracticalCourse ? 'Quiz+Assign (5) + Practical (25) + Terminal (70) = 100' : 'Quiz+Assign (30) + Terminal Exam (70) = 100'}`
                      : `📑 Mid + Final Scheme — ${isPracticalCourse ? 'Quiz+Assign (15) + Practical (25) + Mid (20) + Final (40) = 100' : 'Quiz+Assign (30) + Mid (30) + Final (40) = 100'}`}
                  </strong>
                  {datesheetInfo && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-purple-200 text-purple-950 rounded-full border border-purple-300">
                      Datesheet ({datesheetInfo.examType})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-purple-200 shadow-sm">
              <button
                type="button"
                onClick={() => setExamScheme("MID_FINAL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  examScheme === "MID_FINAL" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mid (30/20) + Final (40)
              </button>
              <button
                type="button"
                onClick={() => setExamScheme("TERMINAL")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  examScheme === "TERMINAL" ? "bg-purple-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Single Terminal Exam (70)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 px-5 py-3 rounded-xl flex-wrap">
            <span className="text-sm font-semibold text-blue-800">📊 Total Marks (out of):</span>
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              disabled={isFacultyLocked}
              value={courseTotalMarks}
              onChange={e => setCourseTotalMarks(parseInt(e.target.value) || 100)}
              className="w-24 px-3 py-1.5 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-700 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isPracticalCourse ? (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                🔬 Practical Included — {examScheme === "TERMINAL" ? "Quiz+Assign: 5, Prac: 25, Terminal: 70" : "Quiz+Assign: 15, Prac: 25, Mid: 20, Final: 40"}
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-purple-100 text-purple-900 rounded-full border border-purple-200">
                📖 Theory Course — {examScheme === "TERMINAL" ? "Quiz+Assign: 30, Terminal Exam: 70" : "Quiz+Assign: 30, Mid: 30, Final: 40"}
              </span>
            )}
          </div>

          <div className="overflow-x-auto border rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  {entryType === "detailed" ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz (Limit {examScheme === "TERMINAL" ? (isPracticalCourse ? '5' : '30') : (isPracticalCourse ? '15' : '30')})</th>
                      {isPracticalCourse && (
                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 bg-blue-100/70 border-x border-blue-200 uppercase">Practical (25)</th>
                      )}
                      {examScheme === "TERMINAL" ? (
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 bg-gray-100 uppercase">Mid Term (Disabled in Terminal)</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mid Term ({isPracticalCourse ? '20' : '30'})</th>
                      )}
                      {examScheme === "TERMINAL" ? (
                        <th className="px-4 py-3 text-left text-xs font-black text-purple-900 bg-purple-100 border-x border-purple-300 uppercase">Terminal Exam (70)</th>
                      ) : (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Term (40)</th>
                      )}
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
                {filteredStudentsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚫</div>
                      <p className="font-semibold text-gray-700">No students found matching search & filter criteria.</p>
                      <p className="text-xs text-gray-400 mt-1">Try clearing search query or changing filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudentsList.map(s => {
                    const totalQuizAssignLimit = examScheme === "TERMINAL"
                      ? (isPracticalCourse ? 5 : 30)
                      : (isPracticalCourse ? 15 : 30);
                    const quizHasFullMarks = (s.quiz || 0) >= totalQuizAssignLimit;
                    const assignHasFullMarks = (s.assignment || 0) >= totalQuizAssignLimit;

                    const obtained = getComputed(s);
                    const gp = getGP(obtained, courseTotalMarks);
                    const grade = getGrade(obtained, courseTotalMarks);
                    const pass = gp >= 1.0;

                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.roll}</div>
                        </td>

                        {entryType === "detailed" ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={totalQuizAssignLimit}
                                step="0.5"
                                disabled={isFacultyLocked || quizHasFullMarks}
                                title={quizHasFullMarks ? `Quiz has taken full ${totalQuizAssignLimit} marks. Assignment auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (s.quiz || 0))}`}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  quizHasFullMarks ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300" : ""
                                }`}
                                value={quizHasFullMarks ? 0 : (s.assignment || "")}
                                onChange={e => handleMarkChange(s.id, "assignment", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={totalQuizAssignLimit}
                                step="0.5"
                                disabled={isFacultyLocked || assignHasFullMarks}
                                title={assignHasFullMarks ? `Assignment has taken full ${totalQuizAssignLimit} marks. Quiz auto-blocked!` : `Max allowed: ${Math.max(0, totalQuizAssignLimit - (s.assignment || 0))}`}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  assignHasFullMarks ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300" : ""
                                }`}
                                value={assignHasFullMarks ? 0 : (s.quiz || "")}
                                onChange={e => handleMarkChange(s.id, "quiz", e.target.value)}
                              />
                            </td>
                            {isPracticalCourse && (
                              <td className="px-4 py-3 bg-blue-50/70 border-x border-blue-200">
                                <input type="number" min="0" max="25" step="0.5" disabled={isFacultyLocked} className="w-20 px-2 py-1 border border-blue-400 rounded text-sm font-black text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm text-center" value={s.practical || ""} onChange={e => handleMarkChange(s.id, "practical", e.target.value)} />
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                step="0.5"
                                disabled={isFacultyLocked || examScheme === "TERMINAL"}
                                className={`w-20 px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-400 ${
                                  examScheme === "TERMINAL" ? "bg-gray-100 text-gray-400 cursor-not-allowed font-bold" : ""
                                }`}
                                value={examScheme === "TERMINAL" ? 0 : (s.mid || "")}
                                onChange={e => handleMarkChange(s.id, "mid", e.target.value)}
                              />
                            </td>
                            <td className={`px-4 py-3 ${examScheme === "TERMINAL" ? "bg-purple-50/70 border-x border-purple-200" : ""}`}>
                              <input
                                type="number"
                                min="0"
                                max={examScheme === "TERMINAL" ? 70 : 40}
                                step="0.5"
                                disabled={isFacultyLocked}
                                className={`w-20 px-2 py-1 border rounded text-sm focus:ring-2 text-center disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  examScheme === "TERMINAL" ? "border-purple-400 font-black text-purple-950 focus:ring-purple-500 shadow-sm bg-white" : "focus:ring-blue-400"
                                }`}
                                value={s.final || ""}
                                onChange={e => handleMarkChange(s.id, "final", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-blue-700 bg-blue-50 text-center">
                              {obtained}
                            </td>
                          </>
                        ) : (
                          <td className="px-4 py-3">
                            <input
                              type="number" min="0" max={courseTotalMarks} step="0.5"
                              disabled={isFacultyLocked}
                              className="w-24 px-3 py-1.5 border-2 border-blue-200 rounded focus:border-blue-500 font-bold text-blue-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              value={s.totalOnly || ""}
                              onChange={e => handleMarkChange(s.id, "totalOnly", e.target.value)}
                            />
                          </td>
                        )}

                        <td className="px-4 py-3 text-center bg-indigo-50 font-bold text-indigo-700">
                          {obtained === 0 ? "—" : grade}
                        </td>

                        <td className="px-4 py-3 text-center bg-purple-50">
                          <span className={`text-sm font-bold ${gp >= 3.5 ? "text-green-600" :
                            gp >= 2.0 ? "text-blue-600" :
                              gp >= 1.0 ? "text-yellow-600" :
                                "text-red-500"
                            }`}>
                            {obtained === 0 ? "—" : gp.toFixed(2)}
                          </span>
                        </td>

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
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
            <div className="text-xs text-gray-500 font-medium">
              Showing {filteredStudentsList.length} of {students.length} student records.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isFacultyLocked && (
                <button
                  onClick={() => handleSaveWithStatus("SAVED", false)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 border border-gray-300"
                >
                  💾 Save Draft
                </button>
              )}

              {!isFacultyLocked && (
                <button
                  onClick={() => handleSaveWithStatus("PENDING_APPROVAL", false)}
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  🚀 Publish / Submit for Approval
                </button>
              )}

              {isAdmin && (
                <>
                  {resultStatus !== "APPROVED" ? (
                    <button
                      onClick={() => handleSaveWithStatus("APPROVED", true)}
                      disabled={saving}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      ✅ Approve & Publish (Lock Result)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveWithStatus("REJECTED", false)}
                      disabled={saving}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      🔓 Unlock / Re-open Result for Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---------------- MODAL 1: FACULTY UNLOCK REQUEST MODAL ---------------- */}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-md w-full mx-4 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📩 Request Result Edit Permission</span>
              </h3>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRequestUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Reason for Result Edit / Unlock Request
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Calculation error in final term marks, or typo during entry..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-gray-900 bg-white"
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This request will be sent to Admin/Super Admin for review and recorded in Audit Logs.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setUnlockModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUnlockReq}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ADMIN UNLOCK REQUESTS MANAGER ---------------- */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full mx-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🛡️ Admin Unlock Requests & Result Permissions Manager</span>
              </h3>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {unlockRequestsList.length > 0 ? (
                unlockRequestsList.map((req, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-gray-50 space-y-2">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <strong className="block text-sm text-gray-900">{req.courseTitle} ({req.courseCode})</strong>
                        <span className="text-xs text-blue-700 font-bold">{req.programName} — Faculty: {req.facultyName}</span>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                        req.status === 'UNLOCK_REQUESTED' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t flex-wrap gap-2">
                      <span className="text-xs text-gray-500 font-semibold">{req.totalStudents} enrolled students</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdminProcessUnlock(req.courseId, "APPROVE")}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow"
                        >
                          ✅ Approve Unlock
                        </button>
                        <button
                          onClick={() => handleAdminProcessUnlock(req.courseId, "REJECT")}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow"
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-400">No pending unlock requests found.</p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setAdminModalOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
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

  const handleExportCSV = () => {
    const headers = [
      "S.No", "Roll No", "Name", "CNIC", "Contact No", "Department/Program", "Session", "Current Semester",
      "GPA 1", "GPA 2", "GPA 3", "GPA 4", "GPA 5", "GPA 6", "GPA 7", "GPA 8", "Current CGPA", "Total CGPA"
    ];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map((s, idx) => [
        idx + 1, s.roll, `"${s.name}"`, s.cnic, s.contact, `"${s.program}"`, `"${s.session}"`, s.currentSemester,
        s.gpa1 || "", s.gpa2 || "", s.gpa3 || "", s.gpa4 || "", s.gpa5 || "", s.gpa6 || "", s.gpa7 || "", s.gpa8 || "",
        s.currentCgpa.toFixed(2), s.totalCgpa.toFixed(2)
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "merit_scholarships_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:m-0 print:space-y-0">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Merit & Scholarships List</h2>
          <p className="text-gray-500 text-sm print:hidden">Generate lists of top performers eligible for scholarships or honors.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Save as PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-end print:hidden">
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
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
                <option value="2026-2030">2026-2030</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2022-2026">2022-2026</option>
                <option value="2024-2026">2024-2026</option>
                <option value="2025-2027">2025-2027</option>
                <option value="2026-2028">2026-2028</option>
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="min-w-full divide-y divide-gray-200 table-auto print:w-full">
            <thead className="bg-gray-50 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">S.No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Roll No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">CNIC</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Contact No</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Department/Program</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-left text-xs print:text-[8px] font-bold text-gray-500 uppercase">Session</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">Current Semester</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 1</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 2</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 3</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 4</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 5</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 6</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 7</th>
                <th className="px-3 py-3 print:px-1 print:py-1 text-center text-xs print:text-[8px] font-bold text-gray-500 uppercase">GPA 8</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-blue-700 uppercase bg-blue-50">Current CGPA</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-center text-xs print:text-[8px] font-bold text-blue-800 uppercase bg-blue-100">Total CGPA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm print:text-[9px] whitespace-nowrap print:whitespace-normal">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-6 py-8 text-center text-gray-500">
                    No students with results found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-semibold text-gray-700">{s.roll}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 font-bold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-600">{s.cnic}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-600">{s.contact}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-700 max-w-[120px] print:max-w-none truncate print:whitespace-normal">{s.program}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-gray-700">{s.session}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-medium text-gray-800">{s.currentSemester}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa1 ? s.gpa1.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa2 ? s.gpa2.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa3 ? s.gpa3.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa4 ? s.gpa4.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa5 ? s.gpa5.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa6 ? s.gpa6.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa7 ? s.gpa7.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 print:px-1 print:py-1 text-center text-gray-600">{s.gpa8 ? s.gpa8.toFixed(2) : '-'}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-bold text-blue-700 bg-blue-50/50 print:bg-transparent">{s.currentCgpa.toFixed(2)}</td>
                    <td className="px-4 py-3 print:px-1.5 print:py-1 text-center font-black text-blue-800 bg-blue-100/50 print:bg-transparent">{s.totalCgpa.toFixed(2)}</td>
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

function StatusAcademicActionsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState("FREEZE");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const bsOnly = data.filter((s: any) => s.educationLevel === "BS");
          setStudents(bsOnly);
          if (bsOnly.length > 0) setSelectedStudentId(bsOnly[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePromote = async (studentId: string, currentSem: number) => {
    const nextSem = currentSem + 1;
    if (nextSem > 8) {
      alert("Student is already in the final 8th semester!");
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSemester: nextSem }),
      });
      if (res.ok) {
        setSuccess(`Student successfully promoted to Semester ${nextSem}!`);
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, currentSemester: nextSem } : s))
        );
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      alert("Promotion failed.");
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType: actionType,
          reason,
        }),
      });
      if (res.ok) {
        setSuccess(`Status action '${actionType}' updated successfully!`);
        setReason("");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      alert("Action failed to execute.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student Academic Status & Actions</h2>
          <p className="text-gray-500 text-sm">Manage semester promotions, academic freezing, dropouts, quit, and migrations.</p>
        </div>
      </div>

      {/* Quick Action Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "FREEZE", label: "❄️ Freeze", desc: "Freeze Semester" },
          { key: "PROMOTED", label: "🏆 Promoted", desc: "Semester Promotion" },
          { key: "DROPOUT", label: "🚫 Dropout", desc: "Mark Dropout" },
          { key: "QUIT", label: "🚪 Quit", desc: "Quit Program" },
          { key: "MIGRATION_IN", label: "➡️ Migration In", desc: "Incoming Migration" },
          { key: "MIGRATION_OUT", label: "⬅️ Migration Out", desc: "Outward Migration" },
        ].map(act => (
          <button
            key={act.key}
            onClick={() => setActionType(act.key)}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all ${actionType === act.key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {act.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      {actionType === "PROMOTED" ? (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-800 flex justify-between items-center">
            <span>🏆 Semester Promotions List</span>
            <span className="text-xs font-normal text-gray-500">{students.length} Students</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Student Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Roll Number</th>
                <th className="px-4 py-3 font-semibold text-center">Current Semester</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{s.user?.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.rollNumber}</td>
                  <td className="px-4 py-3 text-center font-extrabold text-blue-600">Semester {s.currentSemester || 1}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handlePromote(s.id, s.currentSemester || 1)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      🚀 Promote to Sem {(s.currentSemester || 1) + 1}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm max-w-xl">
          <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span>⚙️ Update Academic Action:</span>
            <span className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{actionType}</span>
          </h3>
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Institutional Notes</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Specify reason for freeze, quit, migration, or dropout..."
                className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? "Updating..." : `Confirm ${actionType} Status Update`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
