"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function FacultyDutyNotifier() {
  const { data: session } = useSession();
  const [dutyData, setDutyData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const role = (session?.user as any)?.role || "";
  const isFaculty = ["FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER"].includes(role);
  const isInterFaculty = role === "INTER_FACULTY";

  // Play audio chime + speech alert
  const playDutyAlertSound = (text: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkDuties = async () => {
    if (!session?.user || !isFaculty) return;

    try {
      const res = await fetch("/api/faculty/duties", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setDutyData(data);

      const ttCount = data.publishedTimetablesCount || 0;
      const dsCount = data.publishedDatesheetsCount || 0;

      if (ttCount > 0 || dsCount > 0) {
        const flagKey = `faculty_duty_popup_${session.user.email}_${ttCount}_${dsCount}`;
        const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(flagKey);

        if (!alreadyShown) {
          sessionStorage.setItem(flagKey, "true");
          setModalOpen(true);
          const programLabel = isInterFaculty ? "Intermediate Program" : "BS Academic Program";
          playDutyAlertSound(
            `Notice for Faculty! Admin has published your ${programLabel} class timetable and exam duty schedule. Please review your assigned classes and duties.`
          );
        }
      }
    } catch (err) {
      console.error("Error polling faculty duties:", err);
    }
  };

  useEffect(() => {
    checkDuties();
    const timer = setInterval(checkDuties, 10000);
    return () => clearInterval(timer);
  }, [session]);

  if (!modalOpen || !dutyData) return null;

  const timetables = dutyData.publishedTimetables || [];
  const datesheets = dutyData.publishedDatesheets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-fadeIn p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-xs">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Official Schedule & Duties Published</h3>
              <p className="text-xs text-indigo-600 font-semibold">
                {isInterFaculty ? "Intermediate Program Faculty" : "BS Academic Program Faculty"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Timetable Section */}
        {timetables.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📅 Class Schedule & Room Allocations ({timetables.length})</span>
            </h4>
            <div className="space-y-2">
              {timetables.map((tt: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="block font-bold text-slate-900">{tt.course?.title || "Class Lecture"} ({tt.course?.code || "BS"})</strong>
                    <span className="text-slate-500 font-medium">{tt.program?.name} | Semester {tt.semester}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-lg block">
                      {tt.dayOfWeek}: {tt.startTime} - {tt.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datesheet & Exam Duties Section */}
        {datesheets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📝 Exam Conduct & Invigilation Duties ({datesheets.length})</span>
            </h4>
            <div className="space-y-2">
              {datesheets.map((ds: any, i: number) => (
                <div key={i} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="block font-bold text-amber-950">{ds.course?.title || ds.examType} ({ds.course?.code || "EXAM"})</strong>
                    <span className="text-amber-800 font-medium">{ds.program?.name} | {ds.examType}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg block shadow-xs">
                      {new Date(ds.date).toLocaleDateString()} ({ds.startTime} - {ds.endTime})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all text-center"
          >
            ✅ Acknowledge & View Duties on Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
