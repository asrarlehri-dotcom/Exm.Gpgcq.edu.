"use client";

import { useState, useEffect } from "react";

type FeeSetting = { id: string; key: string; label: string; amount: number; category: string | null };
type Challan    = {
  id: string; challanNumber: string; applicantName: string; fatherName: string | null;
  cnic: string; feeLabel: string; amount: number; dueDate: string; status: string;
  educationLevel: string | null; semester: number | null; session: string | null;
  particulars: string | null; paidAt: string | null; paidId: string | null; createdAt: string;
  gender?: string | null;
  program?: { name: string; code: string | null } | null;
};

type Program = { id: string; name: string; code: string | null };

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID:     "bg-green-100  text-green-800  border-green-200",
  REJECTED: "bg-red-100    text-red-800    border-red-200",
};

function toWords(n: number): string {
  const a = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const b = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  if (n === 0) return "zero";
  if (n < 20)   return a[n];
  if (n < 100)  return b[Math.floor(n/10)] + (n%10 ? " "+a[n%10] : "");
  if (n < 1000) return a[Math.floor(n/100)]+" hundred"+(n%100 ? " "+toWords(n%100) : "");
  if (n < 100000) return toWords(Math.floor(n/1000))+" thousand"+(n%1000 ? " "+toWords(n%1000) : "");
  return toWords(Math.floor(n/100000))+" lakh"+(n%100000 ? " "+toWords(n%100000) : "");
}

export default function BsFeesPage() {
  const [tab, setTab]           = useState<"list"|"generate">("list");
  const [challans, setChallans] = useState<Challan[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeSetting[]>([]);
  const [filter, setFilter]     = useState("ALL");
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  // Generate form state
  const [cnic, setCnic]           = useState("");
  const [name, setName]           = useState("");
  const [father, setFather]       = useState("");
  const [feeType, setFeeType]     = useState("");
  const [session, setSession]     = useState(new Date().getFullYear().toString());
  const [semester, setSemester]   = useState("");
  const [gender, setGender]       = useState("MALE");
  const [programId, setProgramId] = useState("");
  const [daysValid, setDaysValid] = useState("7");
  const [lookingUp, setLookingUp] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Challan | null>(null);
  const [programs, setPrograms]   = useState<Program[]>([]);

  useEffect(() => {
    fetchChallans();
    fetch("/api/fee-settings").then(r => r.json()).then(d => setFeeTypes(Array.isArray(d) ? d : []));
    fetch("/api/public/programs").then(r => r.json()).then(d => setPrograms(Array.isArray(d) ? d : []));
  }, []);

  const fetchChallans = async () => {
    setLoading(true);
    const res = await fetch("/api/challans?educationLevel=BS");
    if (res.ok) setChallans(await res.json());
    setLoading(false);
  };

  // CNIC lookup
  const handleCnicLookup = async () => {
    if (cnic.length < 13) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/admissions?educationLevel=BS`);
      if (res.ok) {
        const admissions = await res.json();
        const match = admissions.find((a: any) => a.cnic === cnic);
        if (match) {
          setName(match.studentName);
          setFather(match.fatherName || "");
          if (match.programId) setProgramId(match.programId);
          if (match.session) setSession(match.session);
          setMsg({ type: "success", text: `✅ Matched admission: ${match.studentName}` });
        } else {
          setMsg({ type: "", text: "" });
        }
      }
    } finally {
      setLookingUp(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeType || !name || !cnic) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnic,
          applicantName: name,
          fatherName: father,
          feeType,
          educationLevel: "BS",
          semester: semester ? Number(semester) : null,
          session,
          gender,
          programId: programId || null,
          daysValid: Number(daysValid)
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerated(data);
        setMsg({ type: "success", text: `Challan ${data.challanNumber} generated!` });
        fetchChallans();
      } else {
        setMsg({ type: "error", text: data.error || "Failed to generate" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/challans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `Challan marked as ${status}` });
      fetchChallans();
    }
  };

  const filtered = filter === "ALL" ? challans : challans.filter(c => c.status === filter);
  const bsFeeTypes = feeTypes.filter(f => f.category === "BS" || f.category === "OTHER");
  const selectedFee = feeTypes.find(f => f.key === feeType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 BS Fees & Challans</h1>
          <p className="text-gray-500 mt-1">Generate challans and approve fee payments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("list"); setGenerated(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            📋 Challans List
          </button>
          <button onClick={() => setTab("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "generate" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            🧾 Generate Challan
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* ── CHALLANS LIST ────────────────────────────── */}
      {tab === "list" && (
        <>
          {/* Filter bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 flex-wrap items-center">
            {["ALL", "PENDING", "PAID", "REJECTED"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {s}
              </button>
            ))}
            <span className="ml-auto text-sm text-gray-400">{filtered.length} / {challans.length}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? <div className="py-16 text-center text-gray-400">Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Challan No.</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Applicant</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Gender</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Program / Session</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Fee Type</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Amount</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Due Date</th>
                      <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-5 py-3 text-center font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-5 py-3 font-mono text-xs font-bold text-blue-700">{c.challanNumber}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{c.applicantName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">CNIC: {c.cnic}</div>
                          {c.fatherName && <div className="text-[11px] text-gray-400">F: {c.fatherName}</div>}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            c.gender === "FEMALE" ? "bg-pink-50 text-pink-700 border border-pink-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {c.gender || "MALE"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-gray-800 text-xs font-semibold">{c.program?.name || "—"}</div>
                          <div className="text-[10px] text-gray-400">Session: {c.session || "—"}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-gray-800 text-xs font-medium">{c.feeLabel}</div>
                          {c.semester && <div className="text-[10px] text-gray-400">Sem {c.semester}</div>}
                        </td>
                        <td className="px-5 py-3 font-bold text-gray-900">
                          Rs. {c.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(c.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full border ${STATUS_COLOR[c.status] || "bg-gray-100"}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center space-y-1">
                          {c.status === "PENDING" && (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleStatus(c.id, "PAID")}
                                className="text-green-600 hover:underline text-xs font-bold">✓ Mark Paid</button>
                              <button onClick={() => handleStatus(c.id, "REJECTED")}
                                className="text-red-500 hover:underline text-xs font-medium">✕ Reject</button>
                            </div>
                          )}
                          {c.status === "PAID" && (
                            <div>
                              <span className="text-xs text-gray-500 font-medium block">
                                {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "—"}
                              </span>
                              {c.paidId && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded">
                                  🆔 {c.paidId}
                                </span>
                              )}
                            </div>
                          )}
                          {c.status === "REJECTED" && (
                            <button onClick={() => handleStatus(c.id, "PENDING")}
                              className="text-blue-500 hover:underline text-xs">↩ Re-open</button>
                          )}
                          <div className="pt-1">
                            <a
                              href={`/print/challan/${c.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100"
                            >
                              🖨️ Print Slip
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} className="py-12 text-center text-gray-400">No challans found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── GENERATE CHALLAN ─────────────────────────── */}
      {tab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-bold text-gray-800">🧾 Generate New Challan</h2>
            <form onSubmit={handleGenerate} className="space-y-4">

              {/* CNIC with lookup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC / Form B <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="text" required placeholder="12345-1234567-1" value={cnic}
                    onChange={e => setCnic(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                  <button type="button" onClick={handleCnicLookup} disabled={lookingUp}
                    className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 disabled:opacity-50">
                    {lookingUp ? "..." : "🔍 Lookup"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-fills name if CNIC matches an admission application.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                  <input type="text" value={father} onChange={e => setFather(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select required value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Program <span className="text-red-500">*</span></label>
                  <select required value={programId} onChange={e => setProgramId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white">
                    <option value="">-- Choose Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type <span className="text-red-500">*</span></label>
                <select required value={feeType} onChange={e => setFeeType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white">
                  <option value="">-- Select Fee Type --</option>
                  {bsFeeTypes.map(f => (
                    <option key={f.key} value={f.key}>{f.label} — Rs. {f.amount.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session (Year)</label>
                  <input type="number" value={session} onChange={e => setSession(e.target.value)} min={2000} max={2099}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={semester} onChange={e => setSemester(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-white">
                    <option value="">—</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due In (days)</label>
                  <input type="number" value={daysValid} onChange={e => setDaysValid(e.target.value)} min={1} max={90}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm" />
                </div>
              </div>

              <button type="submit" disabled={generating}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm">
                {generating ? "Generating..." : "🧾 Generate Challan"}
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👁 Preview</h2>
            {generated ? (
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 space-y-2 text-sm bg-blue-50/30">
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <span className="font-black text-blue-700 text-base">Challan No: {generated.challanNumber}</span>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full border ${STATUS_COLOR[generated.status]}`}>{generated.status}</span>
                </div>
                <p><span className="text-gray-500 w-32 inline-block">Applicant:</span> <strong>{generated.applicantName}</strong></p>
                <p><span className="text-gray-500 w-32 inline-block">Gender:</span> <span className="font-semibold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{generated.gender || "MALE"}</span></p>
                <p><span className="text-gray-500 w-32 inline-block">Father's Name:</span> {generated.fatherName || "—"}</p>
                <p><span className="text-gray-500 w-32 inline-block">CNIC:</span> {generated.cnic}</p>
                <p><span className="text-gray-500 w-32 inline-block">Program:</span> {generated.program?.name || "—"}</p>
                <p><span className="text-gray-500 w-32 inline-block">Fee Type:</span> {generated.feeLabel}</p>
                <p><span className="text-gray-500 w-32 inline-block">Amount:</span> <strong className="text-gray-900">Rs. {generated.amount.toLocaleString()}/-</strong></p>
                <p className="text-xs text-gray-400 italic">({toWords(generated.amount)} rupees only)</p>
                <p><span className="text-gray-500 w-32 inline-block">Due Date:</span> {new Date(generated.dueDate).toLocaleDateString()}</p>
                {generated.paidId && (
                  <p><span className="text-gray-500 w-32 inline-block">Paid ID:</span> <strong className="text-green-700 font-bold">🆔 {generated.paidId}</strong></p>
                )}
                {generated.semester && <p><span className="text-gray-500 w-32 inline-block">Semester:</span> {generated.semester}</p>}
                {generated.session && <p><span className="text-gray-500 w-32 inline-block">Session:</span> {generated.session}</p>}
                <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                  <div className="text-xs text-green-700 font-semibold">
                    ✅ Challan saved successfully!
                  </div>
                  <a
                    href={`/print/challan/${generated.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors block"
                  >
                    🖨️ Print / Open Printable Copy
                  </a>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-300 text-sm">
                Generated challan preview will appear here
              </div>
            )}
            {selectedFee && !generated && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border text-sm space-y-1">
                <p className="font-semibold text-gray-700">{selectedFee.label}</p>
                <p className="text-2xl font-black text-blue-700">Rs. {selectedFee.amount.toLocaleString()}/-</p>
                <p className="text-xs text-gray-400 italic">({toWords(selectedFee.amount)} rupees only)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
