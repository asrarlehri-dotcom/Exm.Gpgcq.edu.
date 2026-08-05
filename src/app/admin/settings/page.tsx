"use client";

import { useState, useEffect } from "react";

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Group = {
  id: string;
  name: string;
  subjects: Subject[];
};

type Program = {
  id: string;
  name: string;
  educationLevel: string;
  groups: Group[];
};

export default function AcademicSettingsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramLevel, setNewProgramLevel] = useState("INTERMEDIATE");

  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroupTo, setAddingGroupTo] = useState<string | null>(null);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [addingSubjectTo, setAddingSubjectTo] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error("Failed to fetch programs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName) return;

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProgramName, educationLevel: newProgramLevel }),
      });
      if (res.ok) {
        setNewProgramName("");
        fetchPrograms();
      }
    } catch (error) {
      console.error("Failed to add program", error);
    }
  };

  const handleAddGroup = async (programId: string) => {
    if (!newGroupName) return;

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, programId }),
      });
      if (res.ok) {
        setNewGroupName("");
        setAddingGroupTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error("Failed to add group", error);
    }
  };

  const handleAddSubject = async (groupId: string) => {
    if (!newSubjectName) return;

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubjectName, code: newSubjectCode, groupId }),
      });
      if (res.ok) {
        setNewSubjectName("");
        setNewSubjectCode("");
        setAddingSubjectTo(null);
        fetchPrograms();
      }
    } catch (error) {
      console.error("Failed to add subject", error);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Programs & Departments</h1>
        <p className="text-gray-500 mt-1">Manage programs, departments, groups, and subject combinations dynamically.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Add New Program</h2>
        <form onSubmit={handleAddProgram} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Program Name (e.g. F.Sc, F.A, BS CS)</label>
            <input
              type="text"
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700">Education Level</label>
            <select
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={newProgramLevel}
              onChange={(e) => setNewProgramLevel(e.target.value)}
            >
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="BS">BS</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Program
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Configured Programs</h2>
        {programs.length === 0 ? (
          <p className="text-gray-500">No programs configured yet.</p>
        ) : (
          programs.map((program) => (
            <div key={program.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {program.name} <span className="text-sm font-normal px-2 py-1 bg-blue-50 text-blue-700 rounded-full ml-2">{program.educationLevel}</span>
                </h3>
                <button className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Groups / Subject Combinations</h4>
                {program.groups?.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No groups configured for this program.</p>
                ) : (
                  <ul className="space-y-4">
                    {program.groups.map(group => (
                      <li key={group.id} className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-800 text-base">{group.name}</span>
                          <button className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-gray-500 text-xs uppercase font-semibold">Subjects: </span>
                          <span className="text-gray-700">
                            {group.subjects.length > 0 
                              ? group.subjects.map(s => `${s.name}${s.code ? ` (${s.code})` : ''}`).join(", ") 
                              : "No subjects added yet."}
                          </span>
                        </div>

                        {/* Add Subject to Group */}
                        {addingSubjectTo === group.id ? (
                          <div className="flex items-center gap-2 mt-3">
                            <input 
                              type="text" 
                              placeholder="Subject Name" 
                              className="px-3 py-1 border rounded text-sm w-48"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="Code (Opt)" 
                              className="px-3 py-1 border rounded text-sm w-24"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                            />
                            <button 
                              onClick={() => handleAddSubject(group.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => { setAddingSubjectTo(null); setNewSubjectName(""); setNewSubjectCode(""); }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setAddingSubjectTo(group.id)}
                            className="text-xs text-blue-600 font-medium hover:underline mt-1"
                          >
                            + Add Subject
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Add Group to Program */}
                {addingGroupTo === program.id ? (
                  <div className="flex items-center gap-2 mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <input 
                      type="text" 
                      placeholder="Group Name (e.g. Pre-Medical)" 
                      className="px-3 py-1.5 border rounded text-sm w-64"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <button 
                      onClick={() => handleAddGroup(program.id)}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                    >
                      Save Group
                    </button>
                    <button 
                      onClick={() => { setAddingGroupTo(null); setNewGroupName(""); }}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingGroupTo(program.id)}
                    className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    + Add New Group to {program.name}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
