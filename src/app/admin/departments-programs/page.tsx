"use client";

import { useState, useEffect, useTransition } from "react";
import { getDepartments, addDepartment, toggleDepartmentStatus, getPrograms, addProgram, toggleProgramStatus } from "./actions";

export default function DepartmentsProgramsPage() {
  const [activeTab, setActiveTab] = useState<"departments" | "programs">("departments");
  const [isPending, startTransition] = useTransition();

  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Form states for Department
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptHod, setDeptHod] = useState("");

  // Form states for Program
  const [progName, setProgName] = useState("");
  const [progCode, setProgCode] = useState("");
  const [progLevel, setProgLevel] = useState("BS");
  const [progDeptId, setProgDeptId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const fetchedDepts = await getDepartments();
    const fetchedProgs = await getPrograms();
    setDepartments(fetchedDepts);
    setPrograms(fetchedProgs);
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    startTransition(async () => {
      await addDepartment({ name: deptName, code: deptCode, hodName: deptHod });
      setDeptName("");
      setDeptCode("");
      setDeptHod("");
      fetchData();
    });
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName || !progCode || !progDeptId) return;
    startTransition(async () => {
      await addProgram({ name: progName, code: progCode, educationLevel: progLevel, departmentId: progDeptId });
      setProgName("");
      setProgCode("");
      setProgDeptId("");
      fetchData();
    });
  };

  const handleToggleDept = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleDepartmentStatus(id, !currentStatus);
      fetchData();
    });
  };

  const handleToggleProg = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleProgramStatus(id, !currentStatus);
      fetchData();
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments & Programs</h1>
          <p className="text-gray-500 mt-1">Manage global departments, programs, and their active status.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b">
          <button 
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'departments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('departments')}
          >
            Departments
          </button>
          <button 
            className={`px-6 py-4 font-medium text-sm ${activeTab === 'programs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('programs')}
          >
            Programs
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <form onSubmit={handleAddDepartment} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" value={deptCode} onChange={e => setDeptCode(e.target.value)} placeholder="e.g. CS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HOD Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" value={deptHod} onChange={e => setDeptHod(e.target.value)} placeholder="e.g. Dr. Ahmed" />
                </div>
                <button type="submit" disabled={isPending} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors h-[42px]">
                  Add Department
                </button>
              </form>

              <div className="border rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HOD</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Programs</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map(dept => (
                      <tr key={dept.id} className={!dept.isActive ? "bg-red-50/50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{dept.name}</div>
                          <div className="text-sm text-gray-500">{dept.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{dept.hodName || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.programs?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleDept(dept.id, dept.isActive)}
                            disabled={isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${dept.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dept.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <div className="text-xs mt-1 font-medium text-gray-500">{dept.isActive ? "Active" : "Deactivated"}</div>
                        </td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No departments configured yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div className="space-y-6">
              <form onSubmit={handleAddProgram} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. BS CS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" value={progCode} onChange={e => setProgCode(e.target.value)} placeholder="e.g. BSCS-01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white" value={progLevel} onChange={e => setProgLevel(e.target.value)}>
                    <option value="BS">BS</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white" value={progDeptId} onChange={e => setProgDeptId(e.target.value)}>
                    <option value="" disabled>-- Select --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={isPending} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors h-[42px]">
                  Add Program
                </button>
              </form>

              <div className="border rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {programs.map(prog => (
                      <tr key={prog.id} className={!prog.isActive ? "bg-red-50/50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{prog.name}</div>
                          <div className="text-sm text-gray-500">{prog.code || "-"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{prog.educationLevel}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {prog.department?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleProg(prog.id, prog.isActive)}
                            disabled={isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${prog.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prog.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <div className="text-xs mt-1 font-medium text-gray-500">{prog.isActive ? "Active" : "Deactivated"}</div>
                        </td>
                      </tr>
                    ))}
                    {programs.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No programs configured yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
