"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Challan = {
  id: string;
  challanNumber: string;
  applicantName: string;
  fatherName: string | null;
  cnic: string;
  feeLabel: string;
  amount: number;
  dueDate: string;
  status: string;
  educationLevel: string | null;
  semester: number | null;
  session: string | null;
  particulars: string | null;
  gender: string | null;
  paidId: string | null;
  paidAt: string | null;
  program?: { name: string; code: string | null } | null;
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

export default function PrintChallanPage() {
  const params = useParams();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      // Parallel fetch challan and settings
      Promise.all([
        fetch(`/api/challans/${params.id}`).then(r => r.json()),
        fetch(`/api/settings`).then(r => r.json())
      ])
      .then(([challanData, settingsData]) => {
        if (challanData && !challanData.error && challanData.amount !== undefined) {
          setChallan(challanData);
        } else {
          setChallan(null);
        }
        if (settingsData && !settingsData.error) {
          setSettings(settingsData);
        }
        setLoading(false);
      })
      .catch(() => {
        setChallan(null);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-semibold">Loading Challan printable copy...</div>;
  }

  if (!challan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
            ✕
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Challan Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            The challan ID is invalid, or the challan was deleted during a database reset.
          </p>
          <a
            href="/bs/fees"
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors w-full block"
          >
            Back to Fees Dashboard
          </a>
        </div>
      </div>
    );
  }

  const copies = [
    { title: "Depositor Copy - 1", num: 1 },
    { title: "Attach with Form - 2", num: 2 },
    { title: "College Copy - 3", num: 3 },
    { title: "Bank Copy - 4", num: 4 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white flex flex-col items-center">
      <style>{`@media print { @page { size: landscape; margin: 5mm; } }`}</style>
      {/* Control bar */}
      <div className="mb-6 print:hidden w-full max-w-7xl bg-white p-4 rounded-xl shadow-md border flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Print Challan - {challan.challanNumber}</h1>
          <p className="text-xs text-gray-500">Challan copy for landscape A4 printing.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow flex items-center gap-2"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-[297mm] bg-white p-4 print:p-0 flex gap-4 justify-between border print:border-none shadow-lg print:shadow-none min-h-[210mm] overflow-hidden text-[10px] text-gray-800 leading-tight">
        {copies.map((copy, i) => (
          <div
            key={copy.num}
            className={`w-[24%] flex flex-col justify-between p-2 relative ${
              i < 3 ? "border-r-2 border-dashed border-gray-300 pr-4" : ""
            }`}
          >
            {/* Header info */}
            <div className="space-y-2">
              <div className="text-center font-bold text-gray-500 text-[9px] uppercase tracking-wider border-b pb-1 mb-2">
                {copy.title}
              </div>

              {/* Logo & title */}
              <div className="flex items-center gap-1.5 justify-center mb-1 text-center">
                {settings.COLLEGE_LOGO ? (
                  <img src={settings.COLLEGE_LOGO} alt="College Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xl">🏛️</span>
                )}
                <div className="text-left leading-none">
                  <div className="font-extrabold text-[8.5px] text-gray-900 uppercase tracking-tight">
                    {settings.COLLEGE_NAME || "Government Post Graduate College Quetta"}
                  </div>
                  <div className="text-[7px] text-gray-400">Computer Generated Challan</div>
                </div>
              </div>

              <div className="text-center bg-gray-50 py-1 border rounded text-[7px] font-semibold text-gray-600 uppercase tracking-wide">
                Bank: {settings.CHALLAN_BANK_NAME || "Habib Bank Limited (HBL)"}<br/>
                Branch Code: {settings.CHALLAN_BRANCH_CODE || "0873"}<br/>
                Title: {settings.CHALLAN_ACCOUNT_TITLE || "Principal Govt College"}<br/>
                A/C No: {settings.CHALLAN_BANK_ACCOUNT || "08730001324203"}
              </div>

              {/* Barcode/QR mockup */}
              <div className="my-2 text-center">
                <div className="inline-block bg-white border p-1 rounded">
                  {/* CSS Mock Barcode */}
                  <div className="flex items-center justify-center gap-[1px] h-6 w-36 bg-gray-100 px-1">
                    {[1,2,1,3,1,2,4,1,2,3,1,2,1,4,1,2,3,1,2,1,3,1,2,4,1].map((w, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }}></div>
                    ))}
                  </div>
                </div>
                <div className="text-[8px] font-mono text-gray-500 mt-1">*{challan.challanNumber}*</div>
              </div>

              {/* Status indicator on printed challan */}
              {challan.status === "PAID" && (
                <div className="absolute top-24 right-4 rotate-12 border-2 border-green-500 text-green-500 font-black text-xs uppercase px-2 py-0.5 rounded opacity-40">
                  PAID
                </div>
              )}

              {/* Details table */}
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Challan No:</span>
                  <span className="font-bold text-gray-900">{challan.challanNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">CNIC / Form B:</span>
                  <span className="font-bold font-mono text-gray-900">{challan.cnic}</span>
                </div>
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[120px]">{challan.applicantName}</span>
                </div>
                {challan.fatherName && (
                  <div className="flex justify-between border-b pb-0.5">
                    <span className="text-gray-500">Father Name:</span>
                    <span className="font-medium truncate max-w-[120px]">{challan.fatherName}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Gender:</span>
                  <span className="font-medium">{challan.gender || "MALE"}</span>
                </div>
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Program:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[120px]">{challan.program?.name || "BS"}</span>
                </div>
                {challan.session && (
                  <div className="flex justify-between border-b pb-0.5">
                    <span className="text-gray-500">Session:</span>
                    <span className="font-medium">{challan.session}</span>
                  </div>
                )}
                {challan.semester && (
                  <div className="flex justify-between border-b pb-0.5">
                    <span className="text-gray-500">Semester:</span>
                    <span className="font-medium">{challan.semester}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="font-bold text-gray-900">{new Date(challan.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-0.5">
                  <span className="text-gray-500">Particulars:</span>
                  <span className="font-medium text-gray-700">{challan.particulars}</span>
                </div>
              </div>

              {/* Amount Info */}
              <div className="bg-gray-50 p-2 rounded border mt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600">Amount:</span>
                  <span className="font-black text-gray-900 text-sm">Rs. {challan.amount.toLocaleString()}/-</span>
                </div>
                <div className="text-[7px] text-gray-400 uppercase italic leading-tight">
                  ({toWords(challan.amount)} rupees only)
                </div>
              </div>

              {/* Paid details */}
              {challan.paidId && (
                <div className="mt-2 p-1.5 bg-green-50 text-green-700 border border-green-100 rounded text-[7px] font-mono leading-none">
                  <strong>PAID ID:</strong> {challan.paidId}<br/>
                  <strong>DATE:</strong> {challan.paidAt ? new Date(challan.paidAt).toLocaleDateString() : ""}
                </div>
              )}
            </div>

            {/* Bottom section (signatures + footer) */}
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-[7px] font-medium text-gray-500 pt-4">
                <div className="text-left border-t border-gray-300 pt-1">
                  Depositor Signature
                </div>
                <div className="text-right border-t border-gray-300 pt-1">
                  Bank Cashier / Officer
                </div>
              </div>

              {/* Stamp and QR Code side-by-side */}
              <div className="flex items-stretch gap-2 h-14">
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-300 font-bold text-[8px] uppercase tracking-wider">
                  Bank Stamp
                </div>
                <div className="w-14 h-14 border rounded p-0.5 bg-white flex items-center justify-center shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                      `CHALLAN:${challan.challanNumber}|NAME:${challan.applicantName}|CNIC:${challan.cnic}|AMOUNT:${challan.amount}|STATUS:${challan.status}`
                    )}`}
                    alt="Challan QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Disclaimers */}
              <div className="text-[6px] text-gray-400 space-y-0.5 border-t pt-1 leading-tight">
                <p>• Challan must be paid on generation / due date.</p>
                <p>• Over-writing or any modification is not accepted.</p>
                <p>• Copy of paid challan must be retained by the student.</p>
                <p>• College/Bank not responsible if paid receipt is lost.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global Landscape print styling */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
