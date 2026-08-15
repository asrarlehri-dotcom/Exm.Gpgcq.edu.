"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Web Audio API chime sound generator
function playNotificationChime(isSuccess: boolean = true) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = isSuccess
      ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Happy Chime)
      : [440.00, 349.23, 293.66];         // A4, F4, D4 (Alert Chime)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isSuccess ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.45);
    });
  } catch (e) {
    console.warn("Audio chime play error:", e);
  }
}

function speakVoiceAlert(text: string) {
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }, 400);
    }
  } catch (e) {}
}

export function AdminUnlockNotifier() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const userEmail = session?.user?.email || "";

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes(userRole);
  const isFaculty = ["FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER"].includes(userRole);

  // Admin state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const lastAdminAlertedCount = useRef<number>(0);

  // Faculty state
  const [facultyAlert, setFacultyAlert] = useState<{
    open: boolean;
    type: "APPROVED" | "REJECTED";
    courseId: string;
    courseTitle: string;
    courseCode: string;
    programName: string;
  } | null>(null);

  const checkUnlockRequests = async () => {
    try {
      const res = await fetch("/api/marks/unlock-request");
      if (!res.ok) return;
      const data = await res.json();

      // ── ADMIN NOTIFICATION LOGIC
      if (isAdmin) {
        const list = data.summaryList || [];
        setPendingRequests(list);

        if (list.length > 0 && list.length > lastAdminAlertedCount.current) {
          playNotificationChime(true);
          speakVoiceAlert("Attention Admin! New result edit unlock request received from Faculty.");
          setIsAdminOpen(true);
        }
        lastAdminAlertedCount.current = list.length;
      }

      // ── FACULTY NOTIFICATION LOGIC
      if (isFaculty) {
        const allCourses = data.allCoursesList || [];

        // Find matching courses for this faculty member
        let myCourses = allCourses.filter((c: any) =>
          (c.facultyEmail && userEmail && c.facultyEmail.toLowerCase() === userEmail.toLowerCase()) ||
          (c.facultyName && userEmail && c.facultyName.toLowerCase().includes(userEmail.split("@")[0].toLowerCase()))
        );

        // Fallback: if no direct email match, inspect any course in UNLOCKED_FOR_EDIT or APPROVED
        if (myCourses.length === 0) {
          myCourses = allCourses.filter((c: any) => c.status === "UNLOCKED_FOR_EDIT" || c.status === "APPROVED");
        }

        for (const course of myCourses) {
          const courseId = course.courseId;
          const currStatus = course.status;

          // Check if alert was already shown for this course and status
          const alertKey = `alert_shown_${courseId}_${currStatus}`;
          const alreadyShown = typeof window !== "undefined" ? sessionStorage.getItem(alertKey) : null;

          if (!alreadyShown) {
            if (currStatus === "UNLOCKED_FOR_EDIT") {
              if (typeof window !== "undefined") sessionStorage.setItem(alertKey, "true");
              playNotificationChime(true);
              speakVoiceAlert(`Great news! Admin has approved your result unlock request for ${course.courseTitle}. Marks are now unlocked for editing.`);
              setFacultyAlert({
                open: true,
                type: "APPROVED",
                courseId: course.courseId,
                courseTitle: course.courseTitle,
                courseCode: course.courseCode,
                programName: course.programName
              });
              break;
            } else if (currStatus === "APPROVED" && course.isLocked) {
              const reqKey = `req_sent_${courseId}`;
              if (typeof window !== "undefined" && sessionStorage.getItem(reqKey)) {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(alertKey, "true");
                  sessionStorage.removeItem(reqKey);
                }
                playNotificationChime(false);
                speakVoiceAlert(`Notice: Admin has declined your result unlock request for ${course.courseTitle}.`);
                setFacultyAlert({
                  open: true,
                  type: "REJECTED",
                  courseId: course.courseId,
                  courseTitle: course.courseTitle,
                  courseCode: course.courseCode,
                  programName: course.programName
                });
                break;
              }
            }
          }
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!isAdmin && !isFaculty) return;

    checkUnlockRequests();

    // Live polling every 5 seconds
    const interval = setInterval(() => {
      checkUnlockRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAdmin, isFaculty, userEmail]);

  const handleAdminProcess = async (courseId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/marks/unlock-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, action })
      });
      const data = await res.json();
      if (res.ok) {
        checkUnlockRequests();
      } else {
        alert(data.error || "Failed to process request");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      {/* ---------------- 1. ADMIN POPUP OVERLAY ---------------- */}
      {isAdmin && isAdminOpen && pendingRequests.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp">
            <div className="bg-gradient-to-r from-amber-500 to-red-600 text-white p-4 rounded-2xl flex items-center justify-between shadow">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🚨</span>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide">
                    URGENT: RESULT UNLOCK REQUEST FROM FACULTY
                  </h2>
                  <p className="text-xs font-semibold text-amber-100 mt-0.5">
                    {pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""} requiring Admin review
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playNotificationChime(true);
                  speakVoiceAlert("Attention Admin! Result edit unlock request received.");
                }}
                title="Replay Alert Chime"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-lg font-bold transition-all"
              >
                🔔
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {pendingRequests.map((req) => (
                <div
                  key={req.courseId}
                  className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3 hover:bg-amber-50 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <strong className="block text-base font-bold text-gray-900">
                        {req.courseTitle} <span className="text-xs font-mono text-gray-500">({req.courseCode})</span>
                      </strong>
                      <span className="text-xs font-bold text-blue-700 block mt-0.5">
                        🎓 {req.programName} — 👨‍🏫 Faculty: {req.facultyName}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-black rounded-full bg-red-600 text-white animate-pulse shadow">
                      UNLOCK REQUESTED
                    </span>
                  </div>

                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs text-gray-600 font-semibold">
                      👥 {req.totalStudents} enrolled student records
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdminProcess(req.courseId, "APPROVE")}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                      >
                        <span>✅ Approve Unlock</span>
                      </button>
                      <button
                        onClick={() => handleAdminProcess(req.courseId, "REJECT")}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1"
                      >
                        <span>❌ Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <Link
                href="/bs/marks"
                onClick={() => setIsAdminOpen(false)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>🔗 Open Full Marks Manager Page</span>
              </Link>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. FACULTY POPUP OVERLAY ---------------- */}
      {isFaculty && facultyAlert?.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-white rounded-3xl border-2 border-blue-400 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            {facultyAlert.type === "APPROVED" ? (
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-2xl flex items-center justify-between shadow">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">🎉</span>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide">
                      RESULT UNLOCK APPROVED BY ADMIN!
                    </h2>
                    <p className="text-xs font-bold text-green-100 mt-0.5">
                      Permission granted to edit student marks.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => playNotificationChime(true)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-lg font-bold"
                >
                  🔔
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl flex items-center justify-between shadow">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">❌</span>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide">
                      RESULT UNLOCK REQUEST DECLINED
                    </h2>
                    <p className="text-xs font-bold text-red-100 mt-0.5">
                      Admin has declined the result edit request.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => playNotificationChime(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-lg font-bold"
                >
                  🔔
                </button>
              </div>
            )}

            <div className="p-4 bg-gray-50 border rounded-2xl space-y-2">
              <strong className="block text-base font-bold text-gray-900">
                {facultyAlert.courseTitle} <span className="text-xs font-mono text-gray-500">({facultyAlert.courseCode})</span>
              </strong>
              <p className="text-xs text-blue-800 font-bold">{facultyAlert.programName}</p>
              <p className="text-xs text-gray-600 pt-1">
                {facultyAlert.type === "APPROVED"
                  ? "Marks have been unlocked. You can now edit the assignment, quiz, midterm, or final term marks and resubmit for approval."
                  : "Admin has retained the result in locked status. Please contact Admin if you need further clarification."}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              {facultyAlert.type === "APPROVED" ? (
                <Link
                  href="/bs/marks"
                  onClick={() => setFacultyAlert(null)}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <span>✏️ Edit Marks Now</span>
                </Link>
              ) : null}
              <button
                onClick={() => setFacultyAlert(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Close Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
