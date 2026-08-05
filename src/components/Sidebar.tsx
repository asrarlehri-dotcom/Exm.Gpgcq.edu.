"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  module?: string;
};

type NavGroup = {
  title: string;
  color: string;
  icon: string;
  items: NavItem[];
  roles?: string[];
};

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { can } = usePermissions();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Intermediate":              true,
    "BS Program":                true,
    "Results / Gazette / Merit": false,
    "Status / Academic Actions": false,
    "System":                    false,
  });

  const toggleGroup = (title: string) =>
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));

  if (!session) return null;
  const role = (session.user as any)?.role as string;

  const isVisible = (item: NavItem): boolean => {
    if (role === "SUPER_ADMIN") return true;
    if (!item.module) return true;
    return can(item.module, ACTIONS.VIEW);
  };

  const isGroupVisible = (group: NavGroup): boolean => {
    if (group.roles && !group.roles.includes(role)) return false;
    return group.items.some(isVisible);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 font-medium ${
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        ? "bg-blue-600 text-white shadow-sm font-bold scale-[1.02]"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`;

  const NAV_GROUPS: NavGroup[] = [
    // ── INTERMEDIATE ────────────────────────────────
    {
      title: "Intermediate",
      color: "text-amber-400 border-amber-500/20",
      icon: "🏫",
      items: [
        { href: "/intermediate/admissions",        label: "📝 Admission",           module: MODULES.INTER_ADMISSIONS },
        { href: "/intermediate/students",           label: "🎓 Student & Enrollment", module: MODULES.INTER_STUDENTS },
        { href: "/intermediate/faculty",            label: "👨‍🏫 Faculty",             module: MODULES.INTER_FACULTY },
        { href: "/intermediate/fees",               label: "💰 Fees & Dues",          module: MODULES.INTER_FEES },
        { href: "/intermediate/attendance",         label: "✅ Attendance",           module: MODULES.INTER_ATTENDANCE },
        { href: "/intermediate/timetable-datesheet",label: "📅 Timetable",            module: MODULES.INTER_TIMETABLE },
      ],
    },

    // ── BS PROGRAM ──────────────────────────────────
    {
      title: "BS Program",
      color: "text-blue-400 border-blue-500/20",
      icon: "🎓",
      items: [
        { href: "/bs/admissions",     label: "📝 Admission",             module: MODULES.BS_ADMISSIONS },
        { href: "/bs/students",       label: "🎓 Students & Enrollment", module: MODULES.BS_STUDENTS },
        { href: "/admin/settings",    label: "⚙️ Programs & Departments", module: MODULES.BS_ACADEMIC_SETUP },
        { href: "/bs/courses",        label: "📚 Courses & Syllabus",    module: MODULES.BS_COURSES },
        { href: "/bs/fees",           label: "💰 Fees & Dues",            module: MODULES.BS_FEES },
        { href: "/bs/timetable-datesheet", label: "📅 Timetable",        module: MODULES.BS_TIMETABLE },
        { href: "/bs/exams-results",  label: "📊 Examination & Conduct", module: MODULES.BS_EXAMS },
      ],
    },

    // ── RESULTS / GAZETTE / MERIT ───────────────────
    {
      title: "Results / Gazette / Merit",
      color: "text-purple-400 border-purple-500/20",
      icon: "📊",
      items: [
        { href: "/bs/marks",       label: "📝 Add Result",      module: MODULES.BS_MARKS },
        { href: "/bs/gpa-cgpa",    label: "🏅 Merit / Toppers", module: MODULES.BS_GPA_CGPA },
        { href: "/bs/gazette",     label: "📰 Gazette",         module: MODULES.BS_GAZETTE },
        { href: "/bs/transcript",  label: "📃 Transcript",      module: MODULES.BS_TRANSCRIPT },
        { href: "/bs/dmc",         label: "📄 DMC",             module: MODULES.BS_DMC },
      ],
    },

    // ── STATUS / ACADEMIC ACTIONS ───────────────────
    {
      title: "Status / Academic Actions",
      color: "text-orange-400 border-orange-500/20",
      icon: "🔀",
      items: [
        { href: "/bs/student-actions?action=freeze",    label: "❄️ Freeze",        module: MODULES.BS_STUDENT_ACTIONS },
        { href: "/bs/promotions",                       label: "🏆 Promoted",       module: MODULES.BS_PROMOTIONS },
        { href: "/bs/student-actions?action=dropout",   label: "🚫 Dropout",        module: MODULES.BS_STUDENT_ACTIONS },
        { href: "/bs/student-actions?action=quit",      label: "🚪 Quit",           module: MODULES.BS_STUDENT_ACTIONS },
        { href: "/bs/student-actions?action=migration-in",  label: "➡️ Migration In",  module: MODULES.BS_STUDENT_ACTIONS },
        { href: "/bs/student-actions?action=migration-out", label: "⬅️ Migration Out", module: MODULES.BS_STUDENT_ACTIONS },
      ],
    },

    // ── SYSTEM ──────────────────────────────────────
    {
      title: "System",
      color: "text-gray-400 border-gray-500/20",
      icon: "🛠️",
      roles: ["SUPER_ADMIN"],
      items: [
        { href: "/admin/users",           label: "👥 Users",             module: MODULES.ADMIN_USERS },
        { href: "/admin/permissions",      label: "🔐 Permission Matrix", module: MODULES.ADMIN_PERMISSIONS },
        { href: "/admin/audit-logs",       label: "📋 Audit Logs",        module: MODULES.ADMIN_AUDIT_LOGS },
        { href: "/admin/settings",         label: "⚙️ Programs & Depts",  module: MODULES.ADMIN_SETTINGS },
        { href: "/admin/settings/fees",    label: "💰 Fee Settings",       module: MODULES.ADMIN_SETTINGS },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-950 text-white min-h-screen border-r border-gray-800/40 select-none shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800/60 bg-gradient-to-r from-gray-950 to-gray-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            🏛️
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-tight leading-tight">CMS PORTAL</div>
            <div className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider">College Management</div>
          </div>
        </div>
      </div>

      {/* Dashboard + Generate Challan */}
      <div className="px-4 pt-4 space-y-1">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          🏠 Dashboard
        </Link>
        <Link href="/bs/fees" className={linkClass("/bs/fees")}>
          🧾 Generate Challan
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          if (!isGroupVisible(group)) return null;
          const isExpanded = expandedGroups[group.title];
          const visibleItems = group.items.filter(isVisible);

          return (
            <div key={group.title} className="rounded-xl border border-gray-800/40 bg-gray-900/10 overflow-hidden">
              {/* Accordion Header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-xs font-black uppercase tracking-wider text-left transition-colors duration-150 bg-gray-900/40 border-b border-gray-800/30 ${group.color} hover:bg-gray-800/30`}
              >
                <div className="flex items-center gap-2">
                  <span>{group.icon}</span>
                  <span>{group.title}</span>
                </div>
                <span className="text-gray-500 transition-transform duration-200">
                  {isExpanded ? "▼" : "▲"}
                </span>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="p-2 space-y-1 bg-gray-950/20 backdrop-blur-md">
                  {visibleItems.map((item) => (
                    <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-800/60 bg-gray-950/40">
        <div className="flex items-center gap-3 mb-3 bg-gray-900/30 p-2 rounded-xl border border-gray-800/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            {session.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-200 truncate">{session.user?.name}</div>
            <div className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase truncate">
              {role?.replace(/_/g, " ")}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 hover:text-white bg-red-950/10 hover:bg-red-600 border border-red-500/10 rounded-lg transition-all duration-200"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );
}
