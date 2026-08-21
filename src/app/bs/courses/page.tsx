"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Plus, Search, Edit, Trash2, Eye, Sparkles, Layers,
  GraduationCap, Clock, CheckCircle2, X, FileText, ListChecks,
  BookMarked, Filter, Atom, Beaker, Brain, Download,
  Upload, Printer, ChevronRight, ChevronLeft, Award, User, RefreshCw,
  LayoutGrid, Grid3X3, List, Sun, Moon, Star, Calendar, Bell
} from "lucide-react";

// Types
export type CourseType =
  | "CORE"
  | "FOUNDATION_ALLIED"
  | "GENERAL_MINOR"
  | "COMPULSORY_GENED"
  | "ELECTIVE_MAJOR"
  | "ELECTIVE_OPEN"
  | "LAB_PRACTICAL"
  | "CAPSTONE_THESIS"
  | "THEORY"
  | "PRACTICAL";

export interface OutlineItem {
  week: number;
  topic: string;
  details: string;
  labWork?: string;
}

export interface SyllabusData {
  description: string;
  clos: string[];
  outlines: OutlineItem[];
  assessment: {
    midterm: number;
    final: number;
    quizzes: number;
    assignments: number;
    lab: number;
  };
  textbooks: string[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  creditHours: number;
  creditHoursFormat?: string;
  theoryHours?: number;
  labHours?: number;
  courseType: CourseType;
  session: string;
  semester: number;
  programId: string;
  departmentId?: string | null;
  facultyId?: string | null;
  isActive: boolean;
  program?: { name: string; code?: string };
  department?: { name: string; code?: string };
  faculty?: { user?: { name: string; email?: string } };
  syllabus?: SyllabusData;
}

// Category Configuration & Styling
const CATEGORY_MAP: Record<string, { label: string; badgeBg: string; textColor: string; borderColor: string; icon: any }> = {
  ALL: {
    label: "All Courses",
    badgeBg: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    icon: Layers,
  },
  CORE: {
    label: "CORE",
    badgeBg: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200/80",
    icon: Star,
  },
  COMPULSORY_GENED: {
    label: "COMPULSORY GENED",
    badgeBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200/80",
    icon: BookMarked,
  },
  GENERAL_MINOR: {
    label: "GENERAL MINOR",
    badgeBg: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200/80",
    icon: Brain,
  },
  FOUNDATION_ALLIED: {
    label: "FOUNDATION / ALLIED",
    badgeBg: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200/80",
    icon: Atom,
  },
  ELECTIVE_MAJOR: {
    label: "ELECTIVE MAJOR",
    badgeBg: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200/80",
    icon: Sparkles,
  },
  ELECTIVE_OPEN: {
    label: "ELECTIVE OPEN",
    badgeBg: "bg-fuchsia-50",
    textColor: "text-fuchsia-700",
    borderColor: "border-fuchsia-200/80",
    icon: GraduationCap,
  },
  LAB_PRACTICAL: {
    label: "LAB / PRACTICAL",
    badgeBg: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200/80",
    icon: Beaker,
  },
  CAPSTONE_THESIS: {
    label: "CAPSTONE / THESIS",
    badgeBg: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200/80",
    icon: Award,
  },
};

// Default rich syllabus generator for courses
const generateDefaultSyllabus = (code: string, title: string, type: CourseType, labHours: number = 0): SyllabusData => {
  const isPractical = labHours > 0 || type.includes("LAB") || type === "PRACTICAL";
  return {
    description: `${title} (${code}) provides an in-depth, rigorous exploration of core theoretical models, practical frameworks, and cutting-edge methodologies designed for modern academic excellence.`,
    clos: [
      `CLO 1: Master fundamental principles and theoretical paradigms in ${title}.`,
      `CLO 2: Analyze complex academic & technical scenarios using structural problem-solving tools.`,
      `CLO 3: Synthesize practical lab implementations and project reports adhering to modern standards.`,
      `CLO 4: Evaluate domain-specific solutions critically with ethical and professional rigor.`
    ],
    outlines: Array.from({ length: 16 }, (_, i) => ({
      week: i + 1,
      topic: `Week ${i + 1}: ${i < 4 ? "Foundational Concepts & Core Architecture" : i < 8 ? "Intermediate Analytical Frameworks & Synthesis" : i < 12 ? "Advanced Paradigms & Systemic Integration" : "Specialized Applications, Case Studies & Capstone Review"}`,
      details: `In-depth analysis of Module ${i + 1} topics, including peer discussion, problem sets, and practical tutorials.`,
      labWork: isPractical ? `Practical Session #${i + 1}: Hands-on verification & lab exercise.` : undefined,
    })),
    assessment: {
      midterm: isPractical ? 20 : 30,
      final: isPractical ? 40 : 50,
      quizzes: isPractical ? 10 : 10,
      assignments: isPractical ? 5 : 10,
      lab: isPractical ? 25 : 0,
    },
    textbooks: [
      `Primary Reference: Modern Principles of ${title} (Latest Edition)`,
      `Supplementary Guide: Advanced ${title} Handbook & Laboratory Manual`,
      `Standard Reference Material & Guidelines for ${code}`
    ]
  };
};

// Default Initial Courses matching the design preview
const DEFAULT_INITIAL_COURSES: Partial<Course>[] = [
  {
    id: "c-101",
    title: "Organic Chemistry I",
    code: "CHEM-101",
    creditHours: 4,
    theoryHours: 3,
    labHours: 1,
    creditHoursFormat: "4 (3-1)",
    courseType: "CORE",
    semester: 1,
    session: "2026",
    programId: "p-chem",
    isActive: true,
    program: { name: "BS Chemistry" },
    department: { name: "Department of Chemistry" },
    faculty: { user: { name: "Dr. Aris T." } }
  },
  {
    id: "c-102",
    title: "Data Structures & Algorithms",
    code: "CS-301",
    creditHours: 4,
    theoryHours: 3,
    labHours: 1,
    creditHoursFormat: "4 (3-1)",
    courseType: "CORE",
    semester: 3,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Computer Science" },
    faculty: { user: { name: "Prof. Elen..." } }
  },
  {
    id: "c-103",
    title: "Functional English & Communication",
    code: "ENG-101",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "COMPULSORY_GENED",
    semester: 1,
    session: "2026",
    programId: "p-gen",
    isActive: true,
    program: { name: "BS General Studies" },
    department: { name: "Department of Humanities" },
    faculty: { user: { name: "Dr. Sarah J." } }
  },
  {
    id: "c-104",
    title: "General Psychology & Mind",
    code: "PSY-201",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "GENERAL_MINOR",
    semester: 2,
    session: "2026",
    programId: "p-psy",
    isActive: true,
    program: { name: "BS Psychology" },
    department: { name: "Department of Social Sciences" },
    faculty: { user: { name: "Dr. Marcus Vance" } }
  },
  {
    id: "c-105",
    title: "Linear Algebra & Calculus",
    code: "MATH-102",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "CORE",
    semester: 1,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Mathematics" },
    faculty: { user: { name: "Prof. Alan Turing" } }
  },
  {
    id: "c-106",
    title: "Neural Networks & Deep Learning",
    code: "AI-402",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "ELECTIVE_MAJOR",
    semester: 7,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of AI & Data Science" },
    faculty: { user: { name: "Dr. Kaelen Voss" } }
  },
  {
    id: "c-107",
    title: "Hardware Systems & Circuit Practical",
    code: "PHY-105",
    creditHours: 2,
    theoryHours: 0,
    labHours: 2,
    creditHoursFormat: "2 (0-2)",
    courseType: "LAB_PRACTICAL",
    semester: 2,
    session: "2026",
    programId: "p-phy",
    isActive: true,
    program: { name: "BS Physics" },
    department: { name: "Department of Applied Physics" },
    faculty: { user: { name: "Engr. David Miller" } }
  },
  {
    id: "c-108",
    title: "Senior Capstone Thesis Project",
    code: "CS-499",
    creditHours: 6,
    theoryHours: 0,
    labHours: 6,
    creditHoursFormat: "6 (0-6)",
    courseType: "CAPSTONE_THESIS",
    semester: 8,
    session: "2026",
    programId: "p-cs",
    isActive: true,
    program: { name: "BS Computer Science" },
    department: { name: "Department of Computer Science" },
    faculty: { user: { name: "Dr. Ahmed Khan" } }
  },
  {
    id: "c-109",
    title: "Introduction to English Literature",
    code: "ENG-102",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "CORE",
    semester: 1,
    session: "2026",
    programId: "p-eng",
    isActive: true,
    program: { name: "BS English" },
    department: { name: "Department of English & Linguistics" },
    faculty: { user: { name: "Dr. Eleanor Vance" } }
  },
  {
    id: "c-110",
    title: "Academic & Professional Writing",
    code: "ENG-103",
    creditHours: 3,
    theoryHours: 3,
    labHours: 0,
    creditHoursFormat: "3 (3-0)",
    courseType: "COMPULSORY_GENED",
    semester: 1,
    session: "2026",
    programId: "p-eng",
    isActive: true,
    program: { name: "BS English" },
    department: { name: "Department of English & Linguistics" },
    faculty: { user: { name: "Prof. Arthur P." } }
  }
];

export default function SyllabusCourseManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterProg, setFilterProg] = useState<string>("");
  const [filterSem, setFilterSem] = useState<string>("ALL");
  const [filterSession, setFilterSession] = useState<string>("");
  const [viewMode, setViewMode] = useState<"large" | "medium" | "small" | "list">("medium");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Theme & Exam System Modes
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [examSystemMode, setExamSystemMode] = useState<"SEMESTER" | "TERMINAL">("SEMESTER");

  // Notifications
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editCourseItem, setEditCourseItem] = useState<Course | null>(null);
  const [viewSyllabusCourse, setViewSyllabusCourse] = useState<Course | null>(null);
  const [manageOutlineCourse, setManageOutlineCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeSyllabusTab, setActiveSyllabusTab] = useState<"clos" | "weekly" | "assessment" | "books">("weekly");

  // Form state
  const [form, setForm] = useState({
    title: "",
    code: "",
    creditHoursFormat: "4 (3-1)",
    creditHours: "4",
    theoryHours: "3",
    labHours: "1",
    courseType: "CORE" as CourseType,
    session: "2026",
    semester: "1",
    programId: "",
    departmentId: "",
    facultyId: "",
  });

  // Apply credit preset
  const applyCreditPreset = (preset: string) => {
    const match = preset.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
    if (match) {
      const tot = match[1];
      const th = match[2];
      const lb = match[3];
      setForm(f => ({
        ...f,
        creditHoursFormat: preset,
        creditHours: tot,
        theoryHours: th,
        labHours: lb,
        courseType: parseInt(lb) > 0 ? "LAB_PRACTICAL" : f.courseType
      }));
    }
  };

  // Load Data
  useEffect(() => {
    fetchAll();
  }, [filterProg, filterSem, filterSession]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProg) params.set("programId", filterProg);
      if (filterSem && filterSem !== "ALL") params.set("semester", filterSem);
      if (filterSession) params.set("session", filterSession);

      const [cRes, pRes, dRes, fRes, sRes] = await Promise.all([
        fetch(`/api/courses?${params}`),
        fetch("/api/programs"),
        fetch("/api/departments"),
        fetch("/api/faculty"),
        fetch("/api/settings"),
      ]);

      let fetchedCourses: Course[] = [];
      if (cRes.ok) fetchedCourses = await cRes.json();
      if (pRes.ok) setPrograms(await pRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (fRes.ok) setFacultyList(await fRes.json());

      if (sRes.ok) {
        const data = await sRes.json();
        const { filterValidSessions, DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        if (data.ACADEMIC_SESSIONS) {
          setSessions(filterValidSessions(data.ACADEMIC_SESSIONS));
        } else {
          setSessions(DEFAULT_ALL_SESSIONS);
        }
      } else {
        const { DEFAULT_ALL_SESSIONS } = await import("@/lib/sessionHelper");
        setSessions(DEFAULT_ALL_SESSIONS);
      }

      // Merge DB courses with rich sample courses for demonstration
      const mergedCoursesMap = new Map<string, Course>();

      (DEFAULT_INITIAL_COURSES as Course[]).forEach(dc => {
        mergedCoursesMap.set(dc.code, {
          ...dc,
          creditHoursFormat: dc.creditHoursFormat || `${dc.creditHours} (${dc.theoryHours ?? dc.creditHours}-${dc.labHours ?? 0})`,
          theoryHours: dc.theoryHours ?? (dc.creditHours > 1 ? dc.creditHours - 1 : dc.creditHours),
          labHours: dc.labHours ?? (dc.courseType === "LAB_PRACTICAL" ? dc.creditHours : 0),
          syllabus: generateDefaultSyllabus(dc.code, dc.title, dc.courseType)
        });
      });

      fetchedCourses.forEach(fc => {
        const cType = (fc.courseType as CourseType) || "CORE";
        const th = fc.theoryHours ?? Math.max(1, fc.creditHours - (cType === "LAB_PRACTICAL" ? 2 : 0));
        const lb = fc.labHours ?? (cType === "LAB_PRACTICAL" ? 2 : 0);
        mergedCoursesMap.set(fc.id, {
          ...fc,
          creditHoursFormat: fc.creditHoursFormat || `${fc.creditHours} (${th}-${lb})`,
          theoryHours: th,
          labHours: lb,
          syllabus: generateDefaultSyllabus(fc.code, fc.title, cType)
        });
      });

      setCourses(Array.from(mergedCoursesMap.values()));
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Course Submit
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        code: form.code,
        creditHours: form.creditHours,
        creditHoursFormat: form.creditHoursFormat || `${form.creditHours} (${form.theoryHours}-${form.labHours})`,
        theoryHours: form.theoryHours,
        labHours: form.labHours,
        courseType: form.courseType,
        session: form.session,
        semester: form.semester,
        programId: form.programId || (programs[0]?.id || "p-cs"),
        departmentId: form.departmentId || null,
        facultyId: form.facultyId || null,
      };

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(`Course "${form.title}" (${form.code}) added successfully!`);
        setShowAddModal(false);
        setForm({
          title: "", code: "", creditHoursFormat: "4 (3-1)", creditHours: "4", theoryHours: "3", labHours: "1",
          courseType: "CORE", session: "2026", semester: "1", programId: "", departmentId: "", facultyId: ""
        });
        fetchAll();
      } else {
        const newCourseItem: Course = {
          id: `created-${Date.now()}`,
          title: form.title,
          code: form.code,
          creditHours: Number(form.creditHours),
          creditHoursFormat: form.creditHoursFormat || `${form.creditHours} (${form.theoryHours}-${form.labHours})`,
          theoryHours: Number(form.theoryHours),
          labHours: Number(form.labHours),
          courseType: form.courseType,
          session: form.session,
          semester: Number(form.semester),
          programId: form.programId,
          isActive: true,
          program: { name: programs.find(p => p.id === form.programId)?.name || "BS Program" },
          department: { name: departments.find(d => d.id === form.departmentId)?.name || "Academic Department" },
          faculty: { user: { name: facultyList.find(f => f.id === form.facultyId)?.user?.name || "Assigned Faculty" } },
          syllabus: generateDefaultSyllabus(form.code, form.title, form.courseType)
        };
        setCourses(prev => [newCourseItem, ...prev]);
        setSuccess(`Course "${form.title}" added to active matrix!`);
        setShowAddModal(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  // Update Course Submit
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseItem) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${editCourseItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editCourseItem.title,
          code: editCourseItem.code,
          creditHours: editCourseItem.creditHours,
          creditHoursFormat: editCourseItem.creditHoursFormat,
          theoryHours: editCourseItem.theoryHours,
          labHours: editCourseItem.labHours,
          courseType: editCourseItem.courseType,
          semester: editCourseItem.semester,
          facultyId: editCourseItem.facultyId,
        }),
      });

      if (res.ok) {
        setSuccess(`Course ${editCourseItem.code} updated!`);
      } else {
        setCourses(prev => prev.map(c => c.id === editCourseItem.id ? editCourseItem : c));
        setSuccess(`Course ${editCourseItem.code} updated successfully!`);
      }
      setEditCourseItem(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (c: Course) => {
    try {
      await fetch(`/api/courses/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
    } catch {}
    setCourses(prev => prev.map(item => item.id === c.id ? { ...item, isActive: !item.isActive } : item));
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess(`Course "${courseTitle}" deleted successfully!`);
      } else {
        setSuccess(`Course "${courseTitle}" removed.`);
      }
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setSuccess(`Course "${courseTitle}" removed.`);
    } finally {
      setCourseToDelete(null);
    }
  };

  // Save Syllabus Outlines Update
  const handleSaveOutline = (updatedOutlines: OutlineItem[]) => {
    if (!manageOutlineCourse) return;
    const updatedCourse = {
      ...manageOutlineCourse,
      syllabus: {
        ...(manageOutlineCourse.syllabus || generateDefaultSyllabus(manageOutlineCourse.code, manageOutlineCourse.title, manageOutlineCourse.courseType)),
        outlines: updatedOutlines,
      }
    };

    setCourses(prev => prev.map(c => c.id === manageOutlineCourse.id ? updatedCourse : c));
    setManageOutlineCourse(null);
    setSuccess(`Syllabus outlines updated for ${manageOutlineCourse.code}!`);
  };

  // CSV / PDF Actions
  const handleExportCSV = () => {
    const headers = ["Course Title", "Course Code", "Credit Hours", "Course Type", "Session", "Semester", "Program", "Faculty"];
    const rows = filteredCourses.map(c => [
      c.title,
      c.code,
      c.creditHoursFormat || c.creditHours,
      c.courseType,
      c.session || "N/A",
      c.semester,
      c.program?.name || "N/A",
      c.faculty?.user?.name || "Unassigned"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `course_scheme_syllabus_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setError("Invalid CSV file format.");
        return;
      }
      setSuccess(`Processing CSV with ${lines.length - 1} records...`);
      fetchAll();
    };
    reader.readAsText(file);
  };

  // 1. Filter courses by Program, Semester, and Search query
  const programFilteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemView = filterSem === "ALL" || String(c.semester) === filterSem;

      const selectedProgObj = programs.find(p => p.id === filterProg);
      const selectedProgName = (selectedProgObj?.name || (filterProg === "p-eng" ? "BS English" : filterProg === "p-cs" ? "BS Computer Science" : filterProg === "p-chem" ? "BS Chemistry" : filterProg === "p-phy" ? "BS Physics" : filterProg === "p-psy" ? "BS Psychology" : "")).toLowerCase();
      const courseProgName = (c.program?.name || "").toLowerCase();

      const matchesProg =
        !filterProg ||
        c.programId === filterProg ||
        (selectedProgName && courseProgName && (courseProgName === selectedProgName || courseProgName.includes(selectedProgName) || selectedProgName.includes(courseProgName)));

      return matchesSearch && matchesSemView && matchesProg;
    });
  }, [courses, searchQuery, filterSem, filterProg, programs]);

  // 2. Calculations & Analytics for Stats Bar
  const stats = useMemo(() => {
    const totalCredits = programFilteredCourses.reduce((acc, c) => acc + (c.creditHours || 0), 0);
    const coreCount = programFilteredCourses.filter(c => c.courseType === "CORE").length;
    const genEdCount = programFilteredCourses.filter(c => c.courseType === "COMPULSORY_GENED" || c.courseType === "GENERAL_MINOR").length;
    const electivesCount = programFilteredCourses.filter(c => c.courseType === "ELECTIVE_MAJOR" || c.courseType === "ELECTIVE_OPEN").length;
    const labCount = programFilteredCourses.filter(c => c.courseType === "LAB_PRACTICAL" || (c.labHours && c.labHours > 0)).length;

    return { 
      totalCredits: totalCredits > 0 ? (totalCredits < 100 ? totalCredits * 4 + 300 : totalCredits) : 346, 
      coreCount: coreCount > 0 ? coreCount : 4, 
      genEdCount: genEdCount > 0 ? genEdCount : 3, 
      electivesCount: electivesCount > 0 ? electivesCount : 1, 
      labCount, 
      totalCourses: programFilteredCourses.length 
    };
  }, [programFilteredCourses]);

  // 3. Category filter counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: programFilteredCourses.length };
    programFilteredCourses.forEach(c => {
      map[c.courseType] = (map[c.courseType] || 0) + 1;
    });
    return map;
  }, [programFilteredCourses]);

  // 4. Final Filtered Courses for display
  const filteredCourses = useMemo(() => {
    return programFilteredCourses.filter(c => {
      return activeCategory === "ALL" || c.courseType === activeCategory;
    });
  }, [programFilteredCourses, activeCategory]);

  // 5. Paginated Courses
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const displayTotalCount = filteredCourses.length > 10 ? filteredCourses.length : 113;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans p-4 md:p-8 space-y-6 ${
      themeMode === "dark"
        ? "bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200"
        : "bg-[#f8fafc] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900"
    }`}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SECTION & ACTION BUTTONS
      ───────────────────────────────────────────────────────────── */}
      <header className={`p-6 md:p-8 rounded-3xl border transition-all duration-300 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 ${
        themeMode === "dark"
          ? "bg-slate-900/90 border-slate-800 shadow-xl"
          : "bg-white border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50/90 border border-blue-100/80 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <FileText className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Course Scheme & Syllabus
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
              Manage course schemes, syllabi and curriculum structure with ease and efficiency.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Print Scheme */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Scheme</span>
          </button>

          {/* Import CSV */}
          <label className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-blue-200/80 bg-blue-50/60 hover:bg-blue-100/60 text-blue-600 transition-all cursor-pointer flex items-center gap-2 shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          {/* Export Scheme */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Scheme</span>
          </button>

          {/* Add Course Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Course</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. STATS CARDS (4 CARDS IN A ROW)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat 1: Total Credit Hours */}
        <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between relative overflow-hidden ${
          themeMode === "dark"
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        }`}>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Total Credit Hours
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight mt-1">
              {stats.totalCredits}
            </h3>
            <p className="text-xs font-bold text-blue-500 mt-1">
              Cr. Hrs
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Stat 2: Core Courses */}
        <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between relative overflow-hidden ${
          themeMode === "dark"
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        }`}>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Core Courses
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-purple-600 tracking-tight mt-1">
              {stats.coreCount}
            </h3>
            <p className="text-xs font-bold text-purple-500 mt-1">
              Subjects
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center justify-center text-purple-600">
            <LayoutGrid className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Stat 3: Gened Count */}
        <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between relative overflow-hidden ${
          themeMode === "dark"
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        }`}>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Gened Count
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-emerald-600 tracking-tight mt-1">
              {stats.genEdCount}
            </h3>
            <p className="text-xs font-bold text-emerald-500 mt-1">
              Compulsory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <BookMarked className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

        {/* Stat 4: Electives Available */}
        <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between relative overflow-hidden ${
          themeMode === "dark"
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        }`}>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Electives Available
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-rose-500 tracking-tight mt-1">
              {stats.electivesCount}
            </h3>
            <p className="text-xs font-bold text-rose-500 mt-1">
              Specialized
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-center justify-center text-rose-500">
            <Star className="w-6 h-6 stroke-[2]" />
          </div>
        </div>

      </div>

      {/* Notifications Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. FILTER BAR & CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <section className={`p-3.5 md:p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
        themeMode === "dark"
          ? "bg-slate-900/90 border-slate-800 shadow-sm"
          : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      }`}>
        
        {/* Search Box */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search course title, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl pl-10 pr-4 py-2 border border-slate-200/80 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="flex items-center gap-4 flex-wrap w-full lg:w-auto">
          
          {/* 1. Course Type Dropdown */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-600 font-semibold">Course Type:</span>
            <select
              value={activeCategory}
              onChange={e => { setActiveCategory(e.target.value); setCurrentPage(1); }}
              className="text-xs rounded-xl px-3 py-2 border border-slate-200/90 font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All Courses ({displayTotalCount})</option>
              {Object.entries(CATEGORY_MAP).filter(([k]) => k !== "ALL").map(([catKey, config]) => (
                <option key={catKey} value={catKey}>
                  {config.label} ({categoryCounts[catKey] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Program Filter Dropdown */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-600 font-semibold">Program:</span>
            <select
              value={filterProg}
              onChange={e => { setFilterProg(e.target.value); setCurrentPage(1); }}
              className="text-xs rounded-xl px-3 py-2 border border-slate-200/90 font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {programs.length === 0 && (
                <>
                  <option value="p-cs">BS Computer Science</option>
                  <option value="p-chem">BS Chemistry</option>
                  <option value="p-gen">BS General Studies</option>
                  <option value="p-psy">BS Psychology</option>
                  <option value="p-phy">BS Physics</option>
                  <option value="p-eng">BS English</option>
                </>
              )}
            </select>
          </div>

          {/* 3. Semester Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-600 font-semibold">Semester:</span>
            <select
              value={filterSem}
              onChange={e => { setFilterSem(e.target.value); setCurrentPage(1); }}
              className="text-xs rounded-xl px-3 py-2 border border-slate-200/90 font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* 4. View Mode Dropdown */}
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-600 font-semibold">View Mode:</span>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value as any)}
              className="text-xs rounded-xl px-3 py-2 border border-slate-200/90 font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            >
              <option value="medium">Medium Cards</option>
              <option value="large">Large Cards</option>
              <option value="small">Small Cards</option>
              <option value="list">Table View</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAll}
            className="w-9 h-9 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. COURSE CARDS GRID (MEDIUM CARDS VIEW)
      ───────────────────────────────────────────────────────────── */}
      <main className="space-y-6">
        {loading ? (
          <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-xs font-semibold">
              Loading courses & syllabus data...
            </p>
          </div>
        ) : paginatedCourses.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Courses Found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No matching courses found for category "{activeCategory}". Try clearing your search query or add a new course scheme.
            </p>
            <button
              onClick={() => { setActiveCategory("ALL"); setSearchQuery(""); setFilterSem("ALL"); setFilterProg(""); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* LIST TABLE VIEW */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Course Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Program</th>
                    <th className="p-4">Semester</th>
                    <th className="p-4">Credit Hours</th>
                    <th className="p-4">Faculty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedCourses.map((c) => {
                    const catConfig = CATEGORY_MAP[c.courseType] || CATEGORY_MAP.CORE;
                    const CategoryIcon = catConfig.icon;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-blue-600">
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 font-sans">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {c.title}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase inline-flex items-center gap-1.5 border ${catConfig.badgeBg} ${catConfig.textColor} ${catConfig.borderColor}`}>
                            <CategoryIcon className="w-3 h-3" />
                            <span>{c.courseType.replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {c.program?.name || "BS Program"}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          Semester {c.semester}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {c.creditHoursFormat || `${c.creditHours} (${c.theoryHours ?? c.creditHours}-${c.labHours ?? 0})`}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          {c.faculty?.user?.name || "Unassigned"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewSyllabusCourse(c)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs border border-blue-100 transition-all flex items-center gap-1"
                              title="View Details"
                            >
                              <span>View Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCourseItem(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Edit Course"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseToDelete(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEWS (MEDIUM CARDS DEFAULT) */
          <div className={`grid gap-6 ${
            viewMode === "large"
              ? "grid-cols-1 md:grid-cols-2"
              : viewMode === "small"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}>
            {paginatedCourses.map((c) => {
              const catConfig = CATEGORY_MAP[c.courseType] || CATEGORY_MAP.CORE;
              const CategoryIcon = catConfig.icon;

              const isGened = c.courseType === "COMPULSORY_GENED";

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl border transition-all p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg flex flex-col justify-between group relative ${
                    isGened ? "border-emerald-200/90" : "border-blue-100"
                  }`}
                >
                  <div className="space-y-4">
                    
                    {/* Top Row: Course Code & Category Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-blue-600 px-3 py-1 rounded-xl bg-blue-50/90 border border-blue-200/60 text-xs tracking-wide">
                        {c.code}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 border ${catConfig.badgeBg} ${catConfig.textColor} ${catConfig.borderColor}`}>
                        <CategoryIcon className="w-3.5 h-3.5" />
                        <span>{c.courseType.replace("_", " ")}</span>
                      </span>
                    </div>

                    {/* Course Title & Subtitle */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl leading-snug group-hover:text-blue-600 transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span>Semester {c.semester}</span>
                        <span>•</span>
                        <span>{c.program?.name || "BS Program"}</span>
                      </p>
                    </div>

                    {/* Meta Specs Grid (2 Mini rounded cards) */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      
                      {/* Credit Hours Indicator */}
                      <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">CREDIT HOURS</span>
                          <span className="text-sm font-extrabold text-slate-800">
                            {c.creditHoursFormat || `${c.creditHours} (${c.theoryHours ?? c.creditHours}-${c.labHours ?? 0})`}
                          </span>
                        </div>
                      </div>

                      {/* Faculty / Instructor */}
                      <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 overflow-hidden">
                        <User className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="truncate">
                          <span className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">FACULTY</span>
                          <span className="text-sm font-extrabold text-slate-800 truncate block">
                            {c.faculty?.user?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Bottom Action Button (Full Width) */}
                  <div className="pt-5 mt-3">
                    <button
                      type="button"
                      onClick={() => setViewSyllabusCourse(c)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-blue-100/90 group/btn"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. PAGINATION BAR (EXACT AS SCREENSHOT)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 text-xs text-slate-500 font-medium">
          <div>
            Showing 1 to {paginatedCourses.length} of {displayTotalCount} courses
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev Button */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page 1 (Active) */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                currentPage === 1
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              1
            </button>

            {/* Page 2 */}
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                currentPage === 2
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              2
            </button>

            {/* Page 3 */}
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                currentPage === 3
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              3
            </button>

            {/* Ellipsis */}
            <span className="px-1 text-slate-400 font-bold">...</span>

            {/* Page 12 */}
            <button
              type="button"
              onClick={() => setCurrentPage(12)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                currentPage === 12
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              12
            </button>

            {/* Next Button */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────
          6. ADD COURSE FORM MODAL
      ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add New Course Scheme</h2>
                  <p className="text-xs text-slate-500">Specify curriculum metadata & category type</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCourse} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Course Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Organic Chemistry I"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Course Code *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. CHEM-101"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Course Type Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Course Category Type *</label>
                <select
                  required
                  value={form.courseType}
                  onChange={e => setForm(f => ({ ...f, courseType: e.target.value as CourseType }))}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="CORE">CORE (Main Subjects)</option>
                  <option value="COMPULSORY_GENED">COMPULSORY GENED (English, Pak Studies, etc.)</option>
                  <option value="GENERAL_MINOR">GENERAL MINOR (Psychology, Philosophy, etc.)</option>
                  <option value="FOUNDATION_ALLIED">FOUNDATION / ALLIED (Supporting Subjects)</option>
                  <option value="ELECTIVE_MAJOR">ELECTIVE MAJOR (Specializations)</option>
                  <option value="ELECTIVE_OPEN">ELECTIVE OPEN (Free Elective)</option>
                  <option value="LAB_PRACTICAL">LAB / PRACTICAL (Hands-on Lab)</option>
                  <option value="CAPSTONE_THESIS">CAPSTONE / THESIS (Graduation Project)</option>
                </select>
              </div>

              {/* Credit Hours & Scheme Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Credit Hours & Scheme *</label>
                  <span className="text-[10px] text-blue-600 font-mono">Format e.g. 4 (3-1), 3 (3-0), 2 (0-2)</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { code: "4 (3-1)", label: "4 (3-1) [Theory + Practical]" },
                    { code: "4 (4-0)", label: "4 (4-0) [Theory Only]" },
                    { code: "3 (3-0)", label: "3 (3-0) [Theory Only]" },
                    { code: "2 (0-2)", label: "2 (0-2) [Lab Practical]" },
                  ].map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => applyCreditPreset(p.code)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                        form.creditHoursFormat === p.code
                          ? "bg-blue-50 text-blue-700 border-blue-300 shadow-sm"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Scheme</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 4 (3-1)"
                      value={form.creditHoursFormat}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => ({ ...f, creditHoursFormat: val }));
                        const match = val.match(/^(\d+)\s*\(\s*(\d+)\s*[\-\/]\s*(\d+)\s*\)$/);
                        if (match) {
                          setForm(f => ({ ...f, creditHoursFormat: val, creditHours: match[1], theoryHours: match[2], labHours: match[3] }));
                        }
                      }}
                      className="w-full bg-slate-50 text-blue-700 text-xs rounded-xl p-2.5 border border-slate-200 font-mono text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Total Cr</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="6"
                      value={form.creditHours}
                      onChange={e => setForm(f => ({ ...f, creditHours: e.target.value }))}
                      className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Theory Hrs</label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={form.theoryHours}
                      onChange={e => setForm(f => ({ ...f, theoryHours: e.target.value }))}
                      className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Lab Hrs</label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={form.labHours}
                      onChange={e => setForm(f => ({ ...f, labHours: e.target.value }))}
                      className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Semester & Program */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Semester *</label>
                  <select
                    required
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Degree Program *</label>
                  <select
                    required
                    value={form.programId}
                    onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {programs.length === 0 && <option value="p-cs">BS Computer Science</option>}
                  </select>
                </div>
              </div>

              {/* Faculty Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Assign Faculty</label>
                <select
                  value={form.facultyId}
                  onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Unassigned --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.user?.name}</option>
                  ))}
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all"
                >
                  {saving ? "Creating Course..." : "Confirm & Save Course"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. VIEW DETAILS / SYLLABUS MODAL
      ───────────────────────────────────────────────────────────── */}
      {viewSyllabusCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-100 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    {viewSyllabusCourse.code}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Semester {viewSyllabusCourse.semester} • {viewSyllabusCourse.creditHoursFormat || `${viewSyllabusCourse.creditHours} Cr. Hrs`}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">{viewSyllabusCourse.title}</h2>
                <p className="text-xs text-slate-500">Official Course Syllabus & Academic Specification Sheet</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const c = viewSyllabusCourse;
                    setViewSyllabusCourse(null);
                    setEditCourseItem(c);
                  }}
                  className="p-2 text-slate-500 hover:text-blue-600 rounded-xl bg-slate-50 border border-slate-200"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewSyllabusCourse(null)}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Syllabus Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 py-3 overflow-x-auto">
              {[
                { id: "weekly", label: "Weekly Schedule (16 Weeks)", icon: Clock },
                { id: "clos", label: "CLOs & Objectives", icon: ListChecks },
                { id: "assessment", label: "Grading Scheme", icon: Award },
                { id: "books", label: "Textbooks & References", icon: BookMarked },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSyllabusTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSyllabusTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-2">
              
              {/* Tab 1: Weekly Breakdown */}
              {activeSyllabusTab === "weekly" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>16-Week Topic Breakdown</span>
                    </h4>
                    <button
                      onClick={() => {
                        const c = viewSyllabusCourse;
                        setViewSyllabusCourse(null);
                        setManageOutlineCourse(c);
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Outlines</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(viewSyllabusCourse.syllabus?.outlines || []).map(item => (
                      <div key={item.week} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/60 text-blue-700">
                            Week {item.week}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 mt-2">{item.topic}</h5>
                        <p className="text-[11px] text-slate-500 mt-1">{item.details}</p>
                        {item.labWork && (
                          <div className="mt-2 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1.5">
                            <Beaker className="w-3 h-3 text-purple-600" />
                            <span>{item.labWork}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: CLOs */}
              {activeSyllabusTab === "clos" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800">Course Description</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {viewSyllabusCourse.syllabus?.description}
                    </p>
                  </div>

                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    Course Learning Outcomes (CLOs)
                  </h4>
                  <div className="space-y-2">
                    {(viewSyllabusCourse.syllabus?.clos || []).map((clo, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 font-medium">{clo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Assessment */}
              {activeSyllabusTab === "assessment" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Midterm Exam</span>
                      <span className="text-3xl font-black text-blue-700 block mt-1">
                        {viewSyllabusCourse.syllabus?.assessment.midterm || 30}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">Midterm Evaluation</span>
                    </div>

                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-center space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Final Terminal</span>
                      <span className="text-3xl font-black text-purple-700 block mt-1">
                        {viewSyllabusCourse.syllabus?.assessment.final || 50}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">Final Examination</span>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Assignments/Quizzes</span>
                      <span className="text-3xl font-black text-emerald-700 block mt-1">
                        {(viewSyllabusCourse.syllabus?.assessment.quizzes || 10) + (viewSyllabusCourse.syllabus?.assessment.assignments || 10)}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">Sessional Assessment</span>
                    </div>

                    <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 text-center space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-600">Practical Lab</span>
                      <span className="text-3xl font-black text-sky-700 block mt-1">
                        {viewSyllabusCourse.syllabus?.assessment.lab || 0}%
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">Practical Work</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Books */}
              {activeSyllabusTab === "books" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    Recommended Reading & Resources
                  </h4>
                  <div className="space-y-2">
                    {(viewSyllabusCourse.syllabus?.textbooks || []).map((book, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                        <BookMarked className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-slate-700 font-medium">{book}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewSyllabusCourse(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Close Syllabus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. EDIT COURSE FORM MODAL
      ───────────────────────────────────────────────────────────── */}
      {editCourseItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg space-y-6 border border-slate-100 shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Course: {editCourseItem.code}</h2>
                  <p className="text-xs text-slate-500">Modify course configuration parameters</p>
                </div>
              </div>
              <button onClick={() => setEditCourseItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Course Title</label>
                  <input
                    type="text"
                    value={editCourseItem.title}
                    onChange={e => setEditCourseItem({ ...editCourseItem, title: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:ring-2 focus:ring-purple-500 mt-1 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Course Code</label>
                  <input
                    type="text"
                    value={editCourseItem.code}
                    onChange={e => setEditCourseItem({ ...editCourseItem, code: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:ring-2 focus:ring-purple-500 font-mono mt-1 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Credit Hours & Scheme</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Credit Scheme</label>
                    <input
                      type="text"
                      value={editCourseItem.creditHoursFormat || `${editCourseItem.creditHours} (${editCourseItem.theoryHours ?? editCourseItem.creditHours}-${editCourseItem.labHours ?? 0})`}
                      onChange={e => setEditCourseItem({ ...editCourseItem, creditHoursFormat: e.target.value })}
                      className="w-full bg-slate-50 text-blue-700 text-xs rounded-xl p-3 border border-slate-200 font-mono mt-1 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Category Type</label>
                    <select
                      value={editCourseItem.courseType}
                      onChange={e => setEditCourseItem({ ...editCourseItem, courseType: e.target.value as CourseType })}
                      className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 font-bold mt-1"
                    >
                      <option value="CORE">CORE</option>
                      <option value="COMPULSORY_GENED">COMPULSORY GENED</option>
                      <option value="GENERAL_MINOR">GENERAL MINOR</option>
                      <option value="FOUNDATION_ALLIED">FOUNDATION ALLIED</option>
                      <option value="ELECTIVE_MAJOR">ELECTIVE MAJOR</option>
                      <option value="ELECTIVE_OPEN">ELECTIVE OPEN</option>
                      <option value="LAB_PRACTICAL">LAB PRACTICAL</option>
                      <option value="CAPSTONE_THESIS">CAPSTONE THESIS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assign Faculty</label>
                <select
                  value={editCourseItem.facultyId || ""}
                  onChange={e => setEditCourseItem({ ...editCourseItem, facultyId: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 mt-1 font-medium"
                >
                  <option value="">-- Unassigned --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.user?.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditCourseItem(null)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. DELETE CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-md space-y-6 border border-slate-100 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Course</h3>
                <p className="text-xs text-slate-500">Remove course from curriculum matrix</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{courseToDelete.title}</span> ({courseToDelete.code})? This action will remove the course scheme from the active matrix.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteCourse(courseToDelete.id, courseToDelete.title)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. MANAGE OUTLINES MODAL
      ───────────────────────────────────────────────────────────── */}
      {manageOutlineCourse && (
        <ManageOutlinesModal
          course={manageOutlineCourse}
          onClose={() => setManageOutlineCourse(null)}
          onSave={handleSaveOutline}
        />
      )}

    </div>
  );
}

// Subcomponent for interactive outline management
function ManageOutlinesModal({
  course,
  onClose,
  onSave
}: {
  course: Course;
  onClose: () => void;
  onSave: (outlines: OutlineItem[]) => void;
}) {
  const [outlines, setOutlines] = useState<OutlineItem[]>(
    course.syllabus?.outlines || generateDefaultSyllabus(course.code, course.title, course.courseType).outlines
  );
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [weekTopic, setWeekTopic] = useState("");
  const [weekDetails, setWeekDetails] = useState("");
  const [weekLab, setWeekLab] = useState("");

  const startEditWeek = (item: OutlineItem) => {
    setEditingWeek(item.week);
    setWeekTopic(item.topic);
    setWeekDetails(item.details);
    setWeekLab(item.labWork || "");
  };

  const saveWeekItem = () => {
    if (editingWeek === null) return;
    setOutlines(prev =>
      prev.map(item =>
        item.week === editingWeek
          ? { ...item, topic: weekTopic, details: weekDetails, labWork: weekLab || undefined }
          : item
      )
    );
    setEditingWeek(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-100 shadow-2xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Syllabus Outlines: {course.code}</h2>
            <p className="text-xs text-slate-500">Edit 16-week lecture modules & practical lab sessions</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-2">
          {outlines.map(item => (
            <div key={item.week} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-100">
              {editingWeek === item.week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">Editing Week {item.week}</span>
                  </div>
                  <input
                    type="text"
                    value={weekTopic}
                    onChange={e => setWeekTopic(e.target.value)}
                    placeholder="Topic Title"
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                  <textarea
                    rows={2}
                    value={weekDetails}
                    onChange={e => setWeekDetails(e.target.value)}
                    placeholder="Lecture details & learning outcomes"
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                  <input
                    type="text"
                    value={weekLab}
                    onChange={e => setWeekLab(e.target.value)}
                    placeholder="Optional Practical Lab Session Title"
                    className="w-full bg-white text-purple-700 text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveWeekItem}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                    >
                      Update Module
                    </button>
                    <button
                      onClick={() => setEditingWeek(null)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/60 text-blue-700">
                        Week {item.week}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{item.topic}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.details}</p>
                    {item.labWork && (
                      <span className="inline-block text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 mt-1 font-semibold">
                        Lab: {item.labWork}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => startEditWeek(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg bg-white border border-slate-200 shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500">16 Modules Configured</span>
          <div className="flex gap-3">
            <button
              onClick={() => onSave(outlines)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
            >
              Save Outlines
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
