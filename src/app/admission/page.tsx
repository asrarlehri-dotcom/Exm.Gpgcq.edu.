"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Program = {
  id: string;
  name: string;
  code: string;
};

const ADMISSION_TYPES = [
  {
    value: "REGULAR",
    label: "BS Regular",
    sub: "1st Semester – Fresh admission",
    icon: "🎓",
  },
  {
    value: "BRIDGING_5TH",
    label: "BS 5th / Bridging",
    sub: "For ADA / ADS degree holders",
    icon: "🔗",
  },
  {
    value: "MIGRATION",
    label: "Migration",
    sub: "Transferring from another university",
    icon: "🔄",
  },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const CURRENT_YEAR = new Date().getFullYear().toString();

export default function AdmissionPage() {
  const router = useRouter();

  const [programs, setPrograms] = useState<Program[]>([]);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  const [programId, setProgramId] = useState("");
  const [session, setSession] = useState(CURRENT_YEAR);
  const [bsAdmissionType, setBsAdmissionType] = useState("REGULAR");
  const [migrationSemester, setMigrationSemester] = useState("");
  const [gender, setGender] = useState("MALE");

  // SSC Qualifications
  const [sscGroup, setSscGroup] = useState("SCIENCE");
  const [sscObtained, setSscObtained] = useState("");
  const [sscTotal, setSscTotal] = useState("1100");
  const [sscYear, setSscYear] = useState("");
  const [sscBoard, setSscBoard] = useState("BBISE QUETTA");

  // HSSC Qualifications
  const [hsscGroup, setHsscGroup] = useState("PRE_MEDICAL");
  const [hsscObtained, setHsscObtained] = useState("");
  const [hsscTotal, setHsscTotal] = useState("1100");
  const [hsscYear, setHsscYear] = useState("");
  const [hsscBoard, setHsscBoard] = useState("BBISE QUETTA");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/public/programs")
      .then(res => res.json())
      .then(data => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!programId) {
      setError("Please select a program.");
      return;
    }
    if (bsAdmissionType === "MIGRATION" && !migrationSemester) {
      setError("Please select the semester you are migrating into.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          fatherName,
          cnic,
          dateOfBirth,
          contactNumber,
          email,
          educationLevel: "BS",
          programId,
          groupId: null,
          bsAdmissionType,
          migrationSemester: bsAdmissionType === "MIGRATION" ? Number(migrationSemester) : null,
          session,
          gender,
          sscGroup,
          sscObtained: sscObtained ? Number(sscObtained) : null,
          sscTotal: sscTotal ? Number(sscTotal) : null,
          sscYear: sscYear ? Number(sscYear) : null,
          sscBoard,
          hsscGroup,
          hsscObtained: hsscObtained ? Number(hsscObtained) : null,
          hsscTotal: hsscTotal ? Number(hsscTotal) : null,
          hsscYear: hsscYear ? Number(hsscYear) : null,
          hsscBoard,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your BS admission application has been received. We will contact you soon.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 sm:p-10 text-white">
          <h1 className="text-3xl font-bold">BS Admission Application</h1>
          <p className="mt-2 opacity-80">
            Fill in the form below to apply for the BS Program.
          </p>
        </div>

        <div className="p-6 sm:p-10 space-y-10">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* ── 1. Personal Details ──────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                1. Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Name</label>
                  <input type="text" required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={studentName} onChange={e => setStudentName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                  <input type="text" required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={fatherName} onChange={e => setFatherName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNIC / Form B</label>
                  <input type="text" required placeholder="12345-1234567-1"
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={cnic} onChange={e => setCnic(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input type="tel" required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select required
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── 2. Program & Session ─────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                2. Program & Session
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Program */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={programId}
                    onChange={e => setProgramId(e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Choose Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.code ? `(${p.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {programs.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">Loading programs...</p>
                  )}
                </div>

                {/* Session */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Academic Session (Year)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2099"
                      value={session}
                      onChange={e => setSession(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSession(CURRENT_YEAR)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline font-medium"
                    >
                      Reset to {CURRENT_YEAR}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Default is current year ({CURRENT_YEAR}). Change if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 3. Academic Qualifications ───────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                3. Academic Qualifications
              </h2>
              
              <div className="space-y-6">
                {/* SSC Matrix Card */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🎓 SSC / Matric Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Group</label>
                      <select required value={sscGroup} onChange={e => setSscGroup(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="SCIENCE">Science</option>
                        <option value="HUMANITIES">Humanities / Arts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Obtained Marks</label>
                      <input type="number" required placeholder="850" value={sscObtained} onChange={e => setSscObtained(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Total Marks</label>
                      <input type="number" required placeholder="1100" value={sscTotal} onChange={e => setSscTotal(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Passing Year</label>
                      <input type="number" required placeholder="2024" value={sscYear} onChange={e => setSscYear(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Board</label>
                      <input type="text" required value={sscBoard} onChange={e => setSscBoard(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>

                {/* HSSC Matrix Card */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">🎓 HSSC / Intermediate Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Group</label>
                      <select required value={hsscGroup} onChange={e => setHsscGroup(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="PRE_MEDICAL">Pre-Medical</option>
                        <option value="PRE_ENGINEERING">Pre-Engineering</option>
                        <option value="HUMANITIES">Humanities / Arts</option>
                        <option value="ICS">ICS</option>
                        <option value="COMMERCE">Commerce</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Obtained Marks</label>
                      <input type="number" required placeholder="750" value={hsscObtained} onChange={e => setHsscObtained(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Total Marks</label>
                      <input type="number" required placeholder="1100" value={hsscTotal} onChange={e => setHsscTotal(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Passing Year</label>
                      <input type="number" required placeholder="2026" value={hsscYear} onChange={e => setHsscYear(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">Board</label>
                      <input type="text" required value={hsscBoard} onChange={e => setHsscBoard(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. Admission Type ──────────────────────────── */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-5">
                4. Admission Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ADMISSION_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setBsAdmissionType(type.value);
                      setMigrationSemester("");
                    }}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                      bsAdmissionType === type.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className={`font-semibold text-sm ${bsAdmissionType === type.value ? "text-blue-700" : "text-gray-800"}`}>
                      {type.label}
                    </span>
                    <span className="text-xs text-gray-500 leading-snug">{type.sub}</span>
                  </button>
                ))}
              </div>

              {/* Migration Semester selector */}
              {bsAdmissionType === "MIGRATION" && (
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-blue-800 mb-3">
                    🔄 Select Semester Migrating Into
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SEMESTERS.map(sem => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setMigrationSemester(String(sem))}
                        className={`py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                          migrationSemester === String(sem)
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
                        }`}
                      >
                        {sem}
                      </button>
                    ))}
                  </div>
                  {migrationSemester && (
                    <p className="mt-3 text-xs text-blue-700 font-medium">
                      ✅ Migrating into Semester {migrationSemester}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Submit ──────────────────────────────────── */}
            <div className="pt-2 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
