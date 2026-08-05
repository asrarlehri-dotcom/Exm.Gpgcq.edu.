"use client";

import { useState, useEffect } from "react";

type StudentData = {
  id: string;
  rollNumber: string;
  user: { name: string };
  currentSemester: number | null;
  isActive: boolean;
};

export default function StudentActionsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [statusType, setStatusType] = useState("FREEZE");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    try {
      const res = await fetch("/api/students/status-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          statusType,
          reason,
        }),
      });

      if (res.ok) {
        setSuccess(`Student status successfully updated to: ${statusType}`);
        setReason("");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      alert("Action failed to execute.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Status Actions</h1>
          <p className="text-gray-500 mt-1">
            Manage migrations, academic freezing, or deactivations (quit).
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-center py-4 text-gray-400">Loading student records...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Action Type</label>
              <select
                value={statusType}
                onChange={(e) => setStatusType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
              >
                <option value="FREEZE">Freeze Semester</option>
                <option value="QUIT">Quit Program</option>
                <option value="MIGRATION">Outward Migration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Notes</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                placeholder="Specify official reasons or institutional notes here..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md"
            >
              Confirm Status Update
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
