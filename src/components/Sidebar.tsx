"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";
import { useSettings } from "@/lib/useSettings";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Calendar,
  ClipboardCheck,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  ShieldCheck,
  Sliders,
  History,
  ChevronDown,
  ChevronRight,
  LogOut,
  HelpCircle,
  LucideIcon
} from "lucide-react";

type NavItem = {
  key?: string;
  href: string;
  label: string;
  module?: string;
  icon?: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
  roles?: string[];
};

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { can } = usePermissions();
  const { collegeName, collegeLogo } = useSettings();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "ACADEMIC": true,
    "FINANCE": true,
    "ADMINISTRATION": true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_expanded_groups_v2");
    if (saved) {
      try {
        setExpandedGroups(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      localStorage.setItem("sidebar_expanded_groups_v2", JSON.stringify(next));
      return next;
    });
  };

  if (!session) return null;
  const role = (session.user as any)?.role as string;
  const userName = session.user?.name || "Super Admin";
  const userEmail = session.user?.email || "admin@college.edu";
  const initials = userName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "SA";

  const isVisible = (item: NavItem): boolean => {
    if (role === "SUPER_ADMIN") return true;
    if (!item.module) return true;
    return can(item.module, ACTIONS.VIEW);
  };

  const isGroupVisible = (group: NavGroup): boolean => {
    if (group.roles && !group.roles.includes(role)) return false;
    return group.items.some(isVisible);
  };

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
      active
        ? "bg-[#3B82F6] text-white shadow-md font-bold scale-[1.01]"
        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
    }`;
  };

  const NAV_GROUPS: NavGroup[] = [
    {
      title: "ACADEMIC",
      items: [
        { key: "admissions",           href: "/bs/admissions",              label: "Admissions",            module: MODULES.BS_ADMISSIONS, icon: UserPlus },
        { key: "students",             href: "/bs/students",                label: "Students & Enrollment", module: MODULES.BS_STUDENTS, icon: Users },
        { key: "programs",             href: "/admin/departments-programs", label: "Programs",             module: MODULES.BS_ACADEMIC_SETUP, icon: Building2 },
        { key: "courses",              href: "/bs/courses",                 label: "Courses & Syllabus",    module: MODULES.BS_COURSES, icon: BookOpen },
        { key: "faculty",              href: "/bs/faculty",                 label: "Faculty",               module: MODULES.BS_STUDENTS, icon: UserCheck },
        { key: "timetable",            href: "/bs/timetable-datesheet",     label: "Timetable",             module: MODULES.BS_TIMETABLE, icon: Calendar },
        { key: "examinations",         href: "/bs/exams-results",           label: "Examinations",          module: MODULES.BS_EXAMS, icon: ClipboardCheck },
        { key: "results-reports",      href: "/bs/gazette",                 label: "Results & Reports",     module: MODULES.BS_GAZETTE, icon: FileText },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { key: "fee-management",       href: "/admin/fees",                 label: "Fee Management",        module: MODULES.BS_FEES, icon: CreditCard },
        { key: "challan-management",   href: "/bs/fees",                    label: "Challan Management",    module: MODULES.BS_FEES, icon: Receipt },
        { key: "dues-payments",        href: "/bs/fees",                    label: "Dues & Payments",       module: MODULES.BS_FEES, icon: DollarSign },
        { key: "expenses",             href: "/admin/expenses",             label: "Expenses",              module: MODULES.ADMIN_EXPENSES, icon: Receipt },
      ],
    },
    {
      title: "ADMINISTRATION",
      roles: ["SUPER_ADMIN"],
      items: [
        { key: "users-roles",          href: "/admin/users",                label: "Users & Roles",         module: MODULES.ADMIN_USERS, icon: ShieldCheck },
        { key: "settings",             href: "/admin/settings",              label: "Settings",              module: MODULES.ADMIN_SETTINGS, icon: Sliders },
        { key: "audit-logs",           href: "/admin/audit-logs",            label: "Audit Logs",            module: MODULES.ADMIN_AUDIT_LOGS, icon: History },
      ],
    },
  ];

  return (
    <aside className="flex flex-col w-64 bg-[#0A1128] text-slate-100 h-screen border-r border-slate-800/80 select-none shadow-2xl z-30 flex-shrink-0 print:hidden">
      {/* Top Header Logo */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3 bg-[#080D21]">
        {collegeLogo ? (
          <img src={collegeLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl bg-slate-800/60 p-1 border border-slate-700/50" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold text-white tracking-wider leading-snug uppercase truncate">
            {collegeName || "GOVT. POSTGRADUATE COLLEGE"}
          </div>
          <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            CMS ERP PORTAL
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 custom-scrollbar">
        {/* Main Dashboard Link */}
        <div>
          <Link href="/dashboard" className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
            pathname === "/dashboard"
              ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/20"
              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
          }`}>
            <LayoutDashboard className="w-4 h-4 text-white flex-shrink-0" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Categories */}
        {NAV_GROUPS.map((group) => {
          if (!isGroupVisible(group)) return null;
          const visibleItems = group.items.filter(isVisible);

          return (
            <div key={group.title} className="space-y-1 pt-1">
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {visibleItems.map((item) => {
                  const ItemIcon = item.icon;
                  const active = pathname === item.href;
                  const itemKey = item.key || `${group.title}-${item.label}`;
                  return (
                    <Link key={itemKey} href={item.href} className={linkClass(item.href)}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ItemIcon && <ItemIcon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`} />}
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 opacity-60 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Card Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#080D21]">
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-200">
            <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="text-xs font-bold">Need Help?</div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Contact support team</p>
          <a
            href="mailto:support@college.edu"
            className="block w-full text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-colors border border-slate-700/60"
          >
            Get Support
          </a>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{userName}</div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

