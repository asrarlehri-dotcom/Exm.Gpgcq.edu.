import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function PrintAdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      program: true,
      challans: true,
    }
  });

  if (!admission) {
    notFound();
  }

  // Get the application fee challan if it exists
  const applicationChallan = admission.challans.find(c => c.feeType === "APPLICATION_FEE") || admission.challans[0];

  let customFields: Record<string, string> = {};
  try {
    if (admission.customFields) {
      customFields = JSON.parse(admission.customFields);
    }
  } catch (e) {
    // Ignore parse error
  }

  // We need the custom fields definition from settings to get the labels
  let customFieldsSettings: any[] = [];
  try {
    const settings = await prisma.systemSetting.findUnique({ where: { key: "ADMISSION_CUSTOM_FIELDS" }});
    if (settings && settings.value) {
      customFieldsSettings = JSON.parse(settings.value);
    }
  } catch (e) {
    // Ignore parse error
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white flex flex-col items-center">
      <style>{`@media print { @page { size: portrait; margin: 10mm; } }`}</style>
      
      {/* Control bar */}
      <div className="mb-6 print:hidden w-full max-w-4xl bg-white p-4 rounded-xl shadow-md border flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Print Admission Form</h1>
          <p className="text-xs text-gray-500">Portrait A4 printing.</p>
        </div>
        <button
          id="print-btn"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow flex items-center gap-2"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-[210mm] bg-white p-8 print:p-0 border print:border-none shadow-lg print:shadow-none min-h-[297mm] text-gray-800">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl mt-1">🏛️</span>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900">College Management</h1>
              <p className="text-sm font-semibold text-gray-600 tracking-wider">Admission Application Form</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Passport Size Photo Box */}
            <div className="w-[30mm] h-[40mm] border-2 border-dashed border-gray-400 flex items-center justify-center text-center text-[8px] text-gray-400 font-bold p-1 bg-gray-50 leading-tight">
              Paste Passport Size Photo Here
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-bold uppercase">Form No.</p>
              <p className="text-xl font-black text-gray-900">{admission.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Challan & Program Info */}
        <div className="bg-gray-100 print:bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-gray-200">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Applied Program</p>
            <p className="text-lg font-black text-blue-900">{admission.program?.name || "N/A"}</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">
              Level: {admission.educationLevel} {admission.session && `| Session: ${admission.session}`}
              {admission.educationLevel === "BS" && admission.bsAdmissionType && ` | Type: ${admission.bsAdmissionType.replace(/_/g, " ")}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Associated Challan No.</p>
            <p className="text-2xl font-black text-gray-900 tracking-widest">{applicationChallan?.challanNumber || "N/A"}</p>
          </div>
        </div>

        {/* Personal Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 uppercase">1. Personal Details</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Student Name</p>
              <p className="text-base font-semibold">{admission.studentName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Father's Name</p>
              <p className="text-base font-semibold">{admission.fatherName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">CNIC / B-Form</p>
              <p className="text-base font-semibold">{admission.cnic || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Date of Birth</p>
              <p className="text-base font-semibold">{new Date(admission.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Contact Number</p>
              <p className="text-base font-semibold">{admission.contactNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Email Address</p>
              <p className="text-base font-semibold">{admission.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Gender</p>
              <p className="text-base font-semibold">{admission.gender || "N/A"}</p>
            </div>
            {admission.residentAddress && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-bold uppercase">Resident Address</p>
                <p className="text-base font-semibold">{admission.residentAddress}</p>
              </div>
            )}
            {customFieldsSettings.map(cf => {
               if (customFields[cf.id]) {
                 return (
                   <div key={cf.id} className={cf.type === 'text' ? 'col-span-2' : ''}>
                     <p className="text-xs text-gray-500 font-bold uppercase">{cf.label}</p>
                     <p className="text-base font-semibold">{customFields[cf.id]}</p>
                   </div>
                 );
               }
               return null;
            })}
          </div>
        </div>

        {/* Academic Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 uppercase">2. Academic Qualifications</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 font-bold text-xs uppercase">Degree/Certificate</th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-xs uppercase">Group/Subject</th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-xs uppercase">Passing Year</th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-xs uppercase">Obtained / Total Marks</th>
                <th className="border border-gray-300 px-4 py-2 font-bold text-xs uppercase">Board / University</th>
              </tr>
            </thead>
            <tbody>
              {admission.sscGroup && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">SSC / Matric</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.sscGroup}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.sscYear || "—"}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.sscObtained} / {admission.sscTotal}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.sscBoard || "—"}</td>
                </tr>
              )}
              {admission.hsscGroup && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">HSSC / Intermediate</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.hsscGroup.replace(/_/g, " ")}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.hsscYear || "—"}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.hsscObtained} / {admission.hsscTotal}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.hsscBoard || "—"}</td>
                </tr>
              )}
              {admission.bscGroup && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">B.Sc / ADP</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.bscGroup.replace(/_/g, " ")}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.bscYear || "—"}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.bscObtained} / {admission.bscTotal}</td>
                  <td className="border border-gray-300 px-4 py-2">{admission.bscBoard || "—"}</td>
                </tr>
              )}
            </tbody>
          </table>

          {admission.bsAdmissionType === "MIGRATION" && admission.previousMarksJson && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Previous Semester Courses Marks (Migration into Semester {admission.migrationSemester})</p>
              <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-1.5 font-bold uppercase">Course ID/Code</th>
                    <th className="border border-gray-300 px-3 py-1.5 font-bold uppercase">Obtained Marks</th>
                    <th className="border border-gray-300 px-3 py-1.5 font-bold uppercase">Total Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    try {
                      const courses = JSON.parse(admission.previousMarksJson || "[]");
                      return courses.map((c: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-3 py-1.5 font-mono">{c.courseId}</td>
                          <td className="border border-gray-300 px-3 py-1.5">{c.obtainedMarks}</td>
                          <td className="border border-gray-300 px-3 py-1.5">{c.totalMarks}</td>
                        </tr>
                      ));
                    } catch (e) {
                      return <tr><td colSpan={3} className="border border-gray-300 px-3 py-1.5 text-red-500 italic">Error parsing previous marks</td></tr>;
                    }
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="mt-20 pt-10 border-t border-gray-300 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p className="text-sm font-bold text-gray-600 uppercase">Applicant Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p className="text-sm font-bold text-gray-600 uppercase">Parent/Guardian Signature</p>
          </div>
        </div>

      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `
        const btn = document.getElementById('print-btn');
        if (btn) {
          btn.addEventListener('click', () => window.print());
        }
        if (window.location.search.includes('autoPrint=true')) {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
      `}} />
    </div>
  );
}
