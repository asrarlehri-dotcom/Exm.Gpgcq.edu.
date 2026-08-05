"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { getDashboardStats } from "../shared-actions";

type EducationLevel = "ALL" | "INTERMEDIATE" | "BS";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [level, setLevel] = useState<EducationLevel>("ALL");
  const [scheduleStats, setScheduleStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setScheduleStats);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {session?.user?.name}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-600">Education Level:</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as EducationLevel)}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 pl-3 pr-10 text-base"
          >
            <option value="ALL">All</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="BS">BS</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Common Stats */}
        <StatCard title="Active Students" value="1,234" color="bg-blue-50 text-blue-700" />
        <StatCard title="Total Faculty" value="56" color="bg-indigo-50 text-indigo-700" />
        
        {/* Intermediate Specific Stats */}
        {(level === "ALL" || level === "INTERMEDIATE") && (
          <>
            <StatCard title="F.Sc Students" value="450" color="bg-green-50 text-green-700" />
            <StatCard title="F.A Students" value="320" color="bg-emerald-50 text-emerald-700" />
            <StatCard title="I.C.S Students" value="180" color="bg-teal-50 text-teal-700" />
            <StatCard title="Intermediate Classes" value="24" color="bg-cyan-50 text-cyan-700" />
          </>
        )}

        {/* BS Specific Stats */}
        {(level === "ALL" || level === "BS") && (
          <>
            <StatCard title="BS Programs" value="8" color="bg-purple-50 text-purple-700" />
            <StatCard title="Regular BS Students" value="210" color="bg-fuchsia-50 text-fuchsia-700" />
            <StatCard title="Bridging Students" value="74" color="bg-pink-50 text-pink-700" />
            <StatCard title="Average CGPA" value="3.1" color="bg-rose-50 text-rose-700" />
          </>
        )}

        {/* Schedule Stats */}
        {scheduleStats && (
          <>
            <StatCard title="Total Syllabus Courses" value={scheduleStats.syllabusCourses.toString()} color="bg-amber-50 text-amber-700" />
            <StatCard title="Total Timetable Entries" value={scheduleStats.totalTimetables.toString()} color="bg-orange-50 text-orange-700" />
            <StatCard title="Auto Timetables" value={scheduleStats.autoTimetables.toString()} color="bg-orange-50 text-orange-700" />
            <StatCard title="Manual Timetables" value={scheduleStats.manualTimetables.toString()} color="bg-orange-50 text-orange-700" />
            
            <StatCard title="Total Date Sheet Entries" value={scheduleStats.totalDatesheets.toString()} color="bg-red-50 text-red-700" />
            <StatCard title="Auto Date Sheets" value={scheduleStats.autoDatesheets.toString()} color="bg-red-50 text-red-700" />
            <StatCard title="Manual Date Sheets" value={scheduleStats.manualDatesheets.toString()} color="bg-red-50 text-red-700" />
            <StatCard title="Published Date Sheets" value={scheduleStats.publishedDatesheets.toString()} color="bg-green-50 text-green-700" />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`mt-4 text-3xl font-bold ${color.split(' ')[1]}`}>
        {value}
      </div>
    </div>
  );
}
