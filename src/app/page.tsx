"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Calendar,
  User,
  UserCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
  Newspaper,
  GraduationCap,
  Building2,
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Home as HomeIcon,
  Menu,
  X,
  ExternalLink,
  Sliders,
  Receipt,
  LogIn
} from "lucide-react";

const TwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

type LeadershipMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  show: boolean;
};

type TickerItem = {
  id: string;
  text: string;
  link: string;
  show: boolean;
};

type EventItem = {
  id: string;
  category: string;
  title: string;
  image: string;
  link: string;
  show: boolean;
};

type NoticeItem = {
  id: string;
  date: string;
  title: string;
  link: string;
  show: boolean;
};

type QuickLinkItem = {
  id: string;
  icon: string;
  label: string;
  link: string;
  show: boolean;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [liveStats, setLiveStats] = useState({ students: 0, programs: 0, faculty: 0, courses: 0 });

  // Top Bar Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Hero Slider index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Quick Challan Modal state
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [challanSearchQuery, setChallanSearchQuery] = useState("");
  const [challanSearchResult, setChallanSearchResult] = useState<any[] | null>(null);
  const [searchingChallan, setSearchingChallan] = useState(false);
  const [challanError, setChallanError] = useState("");

  // Mobile Menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Dropdowns for header
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const heroSlides = [
    {
      title: settings.HOMEPAGE_HERO_TITLE || "Government Boys Postgraduate College, Sariab Road, Quetta",
      subtitle: settings.HOMEPAGE_HERO_SUBTITLE || "A historic institution committed to academic excellence, higher research, and professional student development.",
      image: settings.HOMEPAGE_HERO_BG_IMAGE || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
      badge: "EXCELLENCE IN HIGHER EDUCATION",
    },
    {
      title: "BS 4-Year Degree Programs & Intermediate Studies",
      subtitle: "Offering modern curricula in Computer Science, Natural Sciences, Arts, and Commerce with state-of-the-art laboratories.",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80",
      badge: "ACADEMIC ADMISSIONS OPEN 2026",
    },
    {
      title: "Automated Campus Management System (CMS ERP)",
      subtitle: "Instant access to Course Registrations, Timetables, Online Attendance, Examination Results, and Fee Challans.",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80",
      badge: "SMART DIGITAL CAMPUS",
    },
  ];

  const fetchHomepageData = async () => {
    try {
      const res = await fetch("/api/homepage");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
        if (data.liveStats) setLiveStats(data.liveStats);
      }
    } catch (err) {
      console.error("Error fetching homepage config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  // Handle Hero Carousel Auto Play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Handle Quick Challan Search
  const handleSearchChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challanSearchQuery.trim()) return;
    setSearchingChallan(true);
    setChallanError("");
    setChallanSearchResult(null);
    try {
      const res = await fetch(`/api/challans?search=${encodeURIComponent(challanSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setChallanSearchResult(data);
        } else {
          setChallanError("No challan found for this Roll Number / CNIC.");
        }
      } else {
        setChallanError("Failed to fetch challan details.");
      }
    } catch (err) {
      console.error(err);
      setChallanError("Server error occurred while searching challan.");
    } finally {
      setSearchingChallan(false);
    }
  };

  // Safe parsing helper for JSON fields
  const parseJson = <T,>(jsonString: string | undefined, fallback: T): T => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  // Dynamic values
  const logoText = settings.HOMEPAGE_HEADER_LOGO_TEXT || "GPCQ";
  const logoImage = settings.HOMEPAGE_HEADER_LOGO_IMAGE || "/logo.png";
  const headerSubtext = settings.HOMEPAGE_HEADER_SUBTEXT || "SARIAB ROAD, QUETTA • CMS ERP PORTAL";
  const collegeName = settings.COLLEGE_NAME || "Government Boys Postgraduate College, Sariab Road, Quetta";

  // Visibility Flags
  const showHero = settings.HOMEPAGE_HERO_SHOW !== "false";
  const showStats = settings.HOMEPAGE_STATS_SHOW !== "false";
  const showLeadership = settings.HOMEPAGE_LEADERSHIP_SHOW !== "false";
  const showTicker = settings.HOMEPAGE_TICKER_SHOW !== "false";
  const showEvents = settings.HOMEPAGE_EVENTS_SHOW !== "false";
  const showNotices = settings.HOMEPAGE_NOTICES_SHOW !== "false";
  const showChallanWidget = settings.HOMEPAGE_CHALLAN_WIDGET_SHOW !== "false";
  const showQuickLinks = settings.HOMEPAGE_QUICK_LINKS_SHOW !== "false";
  const showFooter = settings.HOMEPAGE_FOOTER_SHOW !== "false";

  // Parsed Items
  const leadershipItems = parseJson<LeadershipMember[]>(settings.HOMEPAGE_LEADERSHIP_ITEMS, []).filter((i) => i.show);
  const tickerItems = parseJson<TickerItem[]>(settings.HOMEPAGE_TICKER_ITEMS, []).filter((i) => i.show);
  const eventItems = parseJson<EventItem[]>(settings.HOMEPAGE_EVENTS_ITEMS, []).filter((i) => i.show);
  const noticeItems = parseJson<NoticeItem[]>(settings.HOMEPAGE_NOTICES_ITEMS, []).filter((i) => i.show);
  const quickLinks = parseJson<QuickLinkItem[]>(settings.HOMEPAGE_QUICK_LINKS_ITEMS, []).filter((i) => i.show);

  // Stats Values
  const isAutoStats = settings.HOMEPAGE_STATS_MODE === "AUTO";
  const totalStudents = isAutoStats ? liveStats.students : settings.HOMEPAGE_STATS_STUDENTS || "1,420";
  const activePrograms = isAutoStats ? liveStats.programs : settings.HOMEPAGE_STATS_PROGRAMS || "5";
  const facultyMembers = isAutoStats ? liveStats.faculty : settings.HOMEPAGE_STATS_FACULTY || "85";
  const totalCourses = isAutoStats ? liveStats.courses : settings.HOMEPAGE_STATS_COURSES || "85";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071325] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-semibold text-slate-300 tracking-wide text-sm">Loading College Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
      {/* ─────────────────────────────────────────────
          1. TOP DARK NAVY BAR (EXACT DESIGN MATCH)
          Email -> Home, CMS -> Dashboard link, MS Dynamics -> Programs, SAMS -> Timetable & Datesheet, Self-Service, Profile
      ───────────────────────────────────────────── */}
      <div className="bg-[#0A1E3F] text-white py-2 px-4 md:px-8 border-b border-slate-800/80 sticky top-0 z-50 text-xs shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Side Links (Text-only without icons as requested) */}
          <nav className="flex items-center space-x-5 font-bold tracking-wider uppercase text-[11px] md:text-xs overflow-x-auto scrollbar-none py-1">
            <Link href="/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition-colors shrink-0">
              HOME
            </Link>

            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
              title="CMS Dashboard Access"
            >
              CMS
            </Link>

            <Link
              href="/bs/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
            >
              PROGRAMS
            </Link>

            <Link
              href="/bs/timetable-datesheet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
            >
              TIMETABLE & DATESHEET
            </Link>

            <Link
              href="/bs/student-actions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
            >
              SELF-SERVICE
            </Link>

            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
            >
              PROFILE
            </Link>
          </nav>

          {/* Right Side Search Bar */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search GP College..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white text-slate-900 placeholder:text-slate-500 text-xs px-3 py-1.5 pr-2 rounded-l-md outline-none border-none font-medium w-40 md:w-56 focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                className="bg-[#EAB308] hover:bg-[#D97706] text-slate-950 font-extrabold px-3 py-1.5 rounded-r-md transition-colors flex items-center justify-center h-full"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-200 hover:text-white p-1 ml-1"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          2. RED ANNOUNCEMENTS & MEDIA BAR
      ───────────────────────────────────────────── */}
      <div className="bg-[#C81E1E] text-white py-2 px-4 md:px-8 border-b border-red-700/60 shadow-sm text-xs font-bold z-40 relative">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Navigation Items */}
          <div className="flex items-center space-x-6 text-white tracking-wide text-xs md:text-sm overflow-x-auto scrollbar-none">
            <Link href="#notices" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors shrink-0">
              Newsletters
            </Link>
            <Link href="#notices" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors shrink-0">
              Annual Reports
            </Link>
            <Link href="#events" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors shrink-0">
              Convocation
            </Link>
            <Link href="#events" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors shrink-0">
              Media
            </Link>
          </div>

          {/* Right Social Media Links */}
          <div className="flex items-center space-x-3 text-white">
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors p-1" title="Twitter / X">
              <TwitterIcon />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors p-1" title="Facebook">
              <FacebookIcon />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors p-1" title="YouTube">
              <YoutubeIcon />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors p-1" title="LinkedIn">
              <LinkedinIcon />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors p-1" title="Instagram">
              <InstagramIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A1E3F] text-white p-4 border-b border-slate-800 space-y-3 animate-fadeIn relative z-50">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link href="/" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              Home
            </Link>
            <Link href="/dashboard" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              CMS Dashboard
            </Link>
            <Link href="/bs/courses" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              Programs
            </Link>
            <Link href="/bs/timetable-datesheet" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              Timetable & Datesheet
            </Link>
            <Link href="/bs/student-actions" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              Self-Service
            </Link>
            <Link href="/login" className="bg-slate-800 p-2.5 rounded-lg text-amber-400">
              Portal Login
            </Link>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          3. MAIN HERO SLIDER SECTION WITH OVERLAY HEADER (NO WHITE STRIP)
      ───────────────────────────────────────────── */}
      {showHero && (
        <section className="relative bg-[#071325] text-white min-h-[580px] md:min-h-[640px] flex flex-col justify-between overflow-hidden">
          {/* Background Video with Cinematic Overlay */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center scale-105"
              poster={heroSlides[currentSlide]?.image}
            >
              <source src={settings.HOMEPAGE_HERO_BG_VIDEO || "/Homepage.mp4"} type="video/mp4" />
              <source src="/homepage.mp4" type="video/mp4" />
            </video>
            {/* Cinematic Gradient & Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#071325]/90 via-[#0a1e3f]/75 to-[#071325]/95" />
          </div>

          {/* FLOATING OVERLAY HEADER (NO BACKGROUND STRIP AT ALL) */}
          <header className="relative z-30 bg-transparent py-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Logo & Institution Branding */}
              <div className="flex items-center gap-4">
                <Link href="/" className="shrink-0 flex items-center gap-3 group">
                  {logoImage ? (
                    <img
                      src={logoImage}
                      alt="College Logo"
                      className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {logoText}
                    </div>
                  )}
                </Link>

                <div>
                  <h1 className="font-black text-xl md:text-2xl lg:text-3xl text-white tracking-tight leading-none uppercase drop-shadow">
                    GOVT. BOYS POSTGRADUATE COLLEGE
                  </h1>
                  <p className="text-xs md:text-sm font-semibold text-amber-300 mt-1 tracking-wide uppercase drop-shadow-sm">
                    Sariab Road, Quetta, Balochistan • Affiliated Institution & CMS Portal
                  </p>
                </div>
              </div>

              {/* Main Dropdown Navigation Menu */}
              <nav className="hidden lg:flex items-center space-x-6 text-sm font-extrabold text-white">
                {/* About Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-amber-400 py-2 transition-colors">
                    <span>About</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-52 bg-[#0A1E3F]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50">
                    <Link href="#leadership" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      College Leadership
                    </Link>
                    <Link href="#events" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      History & Overview
                    </Link>
                    <Link href="#notices" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Principal's Message
                    </Link>
                  </div>
                </div>

                {/* Students Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-amber-400 py-2 transition-colors">
                    <span>Students</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-[#0A1E3F]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50">
                    <Link href="/admission" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Admissions Portal
                    </Link>
                    <Link href="/bs/courses" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      BS Courses & Curricula
                    </Link>
                    <Link href="/bs/timetable-datesheet" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Timetable & Datesheets
                    </Link>
                    <button
                      onClick={() => setChallanModalOpen(true)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-emerald-400"
                    >
                      Pay Fee / Generate Challan
                    </button>
                  </div>
                </div>

                {/* Faculty Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-amber-400 py-2 transition-colors">
                    <span>Faculty</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-52 bg-[#0A1E3F]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50">
                    <Link href="/bs/faculty" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Faculty Directory
                    </Link>
                    <Link href="/faculty/attendance" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Mark Attendance
                    </Link>
                    <Link href="/bs/marks" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Upload Student Marks
                    </Link>
                  </div>
                </div>

                {/* Offices Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-amber-400 py-2 transition-colors">
                    <span>Offices</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-52 bg-[#0A1E3F]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50">
                    <Link href="/admin/admissions" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Academic Affairs
                    </Link>
                    <Link href="/bs/exams-results" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Examination Branch
                    </Link>
                    <Link href="/bs/fees" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Accounts & Finance
                    </Link>
                  </div>
                </div>

                {/* ORIC / Academics */}
                <div className="relative group">
                  <button className="flex items-center gap-1 hover:text-amber-400 py-2 transition-colors">
                    <span>ORIC</span>
                    <ChevronDown className="w-4 h-4 text-amber-400" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-[#0A1E3F]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50">
                    <Link href="#events" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Research & Publications
                    </Link>
                    <Link href="#notices" target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 hover:bg-slate-800/80 text-xs font-semibold text-slate-100 hover:text-amber-300">
                      Quality Enhancement Cell
                    </Link>
                  </div>
                </div>
              </nav>
            </div>

            {/* FLOATING DEVELOPMENT NOTICE TICKER BAR (DIRECTLY UNDER LOGO/NAV ROW) */}
            <div className="mt-3.5 bg-[#0A1E3F]/85 backdrop-blur-md border-y border-amber-500/40 py-2 px-4 shadow-md">
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] md:text-xs uppercase px-2.5 py-0.5 rounded shrink-0 tracking-wider flex items-center gap-1.5 shadow">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DEVELOPMENT NOTICE:</span>
                </div>

                <div className="overflow-hidden relative w-full flex items-center">
                  <div className="whitespace-nowrap animate-marquee text-xs md:text-sm font-bold text-amber-200 tracking-wide">
                    <span className="inline-flex items-center gap-3 mr-12">
                      <span>The project is currently under development by Israr Ahmed (Computer Programmer). Please be patient if you encounter any missing data or errors.</span>
                      <span className="text-amber-400/80 font-normal">★</span>
                    </span>
                    <span className="inline-flex items-center gap-3 mr-12">
                      <span>The project is currently under development by Israr Ahmed (Computer Programmer). Please be patient if you encounter any missing data or errors.</span>
                      <span className="text-amber-400/80 font-normal">★</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Left Arrow Button */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-amber-500 hover:text-slate-950 backdrop-blur-md flex items-center justify-center transition-all text-white shadow-lg border border-white/20"
            title="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-amber-500 hover:text-slate-950 backdrop-blur-md flex items-center justify-center transition-all text-white shadow-lg border border-white/20"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Hero Main Content */}
          <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10 py-12">
            <span className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] md:text-xs font-extrabold uppercase px-4 py-1.5 rounded-full tracking-wider shadow-sm backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{heroSlides[currentSlide].badge}</span>
            </span>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-lg max-w-4xl mx-auto">
              {heroSlides[currentSlide].title}
            </h2>

            <p className="text-sm md:text-lg text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setChallanModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Receipt className="w-5 h-5" />
                <span>Generate Fee Challan</span>
              </button>

              <Link
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm md:text-base px-6 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Access CMS Dashboard</span>
              </Link>

              <Link
                href="/admission"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-xl border border-slate-600 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>Online Admission 2026</span>
              </Link>
            </div>

            {/* Slide Indicators */}
            <div className="flex items-center justify-center space-x-2 pt-2 pb-6">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === currentSlide ? "bg-amber-400 w-8" : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          5. STATS CARDS (FLOATING GRID)
      ───────────────────────────────────────────── */}
      {showStats && (
        <section className="max-w-7xl mx-auto w-full px-4 md:px-8 -mt-10 relative z-20 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-amber-500 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>TOTAL STUDENTS</span>
              </span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalStudents}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-emerald-500 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>ACTIVE PROGRAMS</span>
              </span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{activePrograms}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-blue-600 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>FACULTY MEMBERS</span>
              </span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{facultyMembers}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-purple-600 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>TOTAL COURSES</span>
              </span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalCourses}</p>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          6. TICKER / LATEST ANNOUNCEMENT MARQUEE (PLACED BELOW STATS)
      ───────────────────────────────────────────── */}
      {showTicker && tickerItems.length > 0 && (
        <section className="bg-[#0A1E3F] text-white py-3 px-4 border-y border-slate-800 mb-12 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="bg-amber-500 text-slate-950 font-black text-[11px] md:text-xs uppercase px-3 py-1 rounded-md shrink-0 tracking-wider flex items-center gap-1.5 shadow">
              <Clock className="w-3.5 h-3.5" />
              <span>{settings.HOMEPAGE_TICKER_BADGE || "LATEST NOTICES:"}</span>
            </div>

            <div className="overflow-hidden relative w-full flex items-center">
              <div className="whitespace-nowrap animate-marquee text-xs md:text-sm font-bold text-amber-300 tracking-wide">
                {tickerItems.map((item, idx) => (
                  <span key={item.id} className="inline-flex items-center gap-3 mr-12">
                    <a href={item.link || "#notices"} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                      {item.text}
                    </a>
                    <span className="text-amber-500/60 font-normal">★</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          7. PORTAL QUICK ACCESS SERVICES TILES
      ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 mb-14">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#0A1E3F] tracking-tight">
            Academic Portals & Digital Services
          </h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Direct quick access to all essential student, faculty, and administrative portals
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <HomeIcon className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-amber-600">Home</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Main Portal</span>
          </Link>

          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600">CMS Dashboard</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Student & Admin</span>
          </Link>

          <Link
            href="/bs/courses"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-600">BS Programs</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Courses & Outline</span>
          </Link>

          <Link
            href="/bs/timetable-datesheet"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-500 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-purple-600">Timetable & Datesheet</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Schedules</span>
          </Link>

          <Link
            href="/bs/student-actions"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-500 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-rose-600">Self-Services</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Clearance & Requests</span>
          </Link>

          <button
            onClick={() => setChallanModalOpen(true)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all flex flex-col items-center text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">Fee Challan</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Download Voucher</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          8. ADMINISTRATION & LEADERSHIP SECTION
      ───────────────────────────────────────────── */}
      {showLeadership && leadershipItems.length > 0 && (
        <section id="leadership" className="max-w-7xl mx-auto w-full px-4 md:px-8 mb-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-extrabold text-[#0A1E3F] tracking-tight">
              {settings.HOMEPAGE_LEADERSHIP_TITLE || "Administration & Leadership"}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {settings.HOMEPAGE_LEADERSHIP_SUBTITLE || "Meet the key leadership guiding the institution toward excellence"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leadershipItems.map((member) => (
              <a
                key={member.id}
                href="#leadership"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col items-center group cursor-pointer"
              >
                <div className="w-full h-60 bg-slate-100 overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 text-center w-full bg-white">
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">{member.name}</h4>
                  <p className="text-xs font-semibold text-amber-600 mt-1">{member.role}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          9. CAMPUS LIFE & RECENT EVENTS
      ───────────────────────────────────────────── */}
      {showEvents && eventItems.length > 0 && (
        <section id="events" className="max-w-7xl mx-auto w-full px-4 md:px-8 mb-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-extrabold text-[#0A1E3F] tracking-tight">
              {settings.HOMEPAGE_EVENTS_TITLE || "Campus Life & Recent Events"}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {settings.HOMEPAGE_EVENTS_SUBTITLE || "Glances at recent academic sessions, convocations, and student activities"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventItems.map((evt) => (
              <a
                key={evt.id}
                href={evt.link || "#events"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col group cursor-pointer"
              >
                <div className="w-full h-60 bg-slate-100 overflow-hidden relative">
                  <img
                    src={evt.image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block">
                      {evt.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base md:text-lg mt-2 leading-snug group-hover:text-blue-700 transition-colors">
                      {evt.title}
                    </h4>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          10. OFFICIAL NOTICES & QUICK LINKS SPLIT GRID
      ───────────────────────────────────────────── */}
      <section id="notices" className="max-w-7xl mx-auto w-full px-4 md:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Official Notices (2 cols wide on lg) */}
          {showNotices && (
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-extrabold text-[#0A1E3F]">
                  {settings.HOMEPAGE_NOTICES_TITLE || "Official Notices & Announcements"}
                </h3>
                <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Public Notices</span>
              </div>

              <div className="divide-y divide-slate-100">
                {noticeItems.map((not) => (
                  <a
                    key={not.id}
                    href={not.link || "#notices"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-4 first:pt-0 last:pb-0 hover:bg-slate-50 p-3 rounded-xl transition-colors group cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{not.date}</span>
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 mt-1 group-hover:text-blue-700 leading-snug">
                      {not.title}
                    </h4>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Fee Challan Widget + Quick Links */}
          <div className="space-y-6">
            {/* Fee Challan Portal Card */}
            {showChallanWidget && (
              <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-6 rounded-2xl shadow-md text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-amber-300 mx-auto flex items-center justify-center">
                  <Receipt className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black tracking-tight">
                  {settings.HOMEPAGE_CHALLAN_WIDGET_TITLE || "Fee Challan Portal"}
                </h4>
                <p className="text-xs text-emerald-100 leading-relaxed max-w-xs mx-auto">
                  {settings.HOMEPAGE_CHALLAN_WIDGET_DESC ||
                    "Students can generate and download their semester fee challan instantly using their Roll Number."}
                </p>

                <button
                  onClick={() => setChallanModalOpen(true)}
                  className="w-full bg-white text-emerald-900 font-extrabold text-sm py-3 px-4 rounded-xl shadow hover:bg-amber-300 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <Receipt className="w-4 h-4 text-emerald-800" />
                  <span>{settings.HOMEPAGE_CHALLAN_WIDGET_BTN || "Generate Fee Challan"}</span>
                </button>
              </div>
            )}

            {/* Quick Links Card */}
            {showQuickLinks && quickLinks.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h4 className="text-base font-extrabold text-[#0A1E3F] border-b border-slate-100 pb-3">
                  {settings.HOMEPAGE_QUICK_LINKS_TITLE || "Quick Links"}
                </h4>

                <ul className="space-y-2.5">
                  {quickLinks.map((ql) => (
                    <li key={ql.id}>
                      <Link
                        href={ql.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-xs md:text-sm font-bold text-slate-700 hover:text-blue-700 transition-colors p-2.5 hover:bg-slate-50 rounded-xl"
                      >
                        <span className="text-base">{ql.icon || "📌"}</span>
                        <span>{ql.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          11. FOOTER
      ───────────────────────────────────────────── */}
      {showFooter && (
        <footer className="mt-auto bg-[#071325] text-slate-400 text-xs py-8 px-4 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="College Logo" className="w-10 h-10 object-contain" />
              <div>
                <p className="font-bold text-white uppercase text-sm">Govt. Boys Postgraduate College, Sariab Road, Quetta</p>
                <p className="text-[11px] text-slate-500">Balochistan University Affiliated institution</p>
              </div>
            </div>

            <p className="text-center md:text-right text-slate-400">
              {settings.HOMEPAGE_FOOTER_COPYRIGHT ||
                "© 2026 Government Boys Postgraduate College, Sariab Road, Quetta. All Rights Reserved."}
            </p>

            <div className="flex items-center gap-4 text-slate-300 font-bold">
              <Link href="/login" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                Admin Portal
              </Link>
              <span>•</span>
              <Link href="/admission" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">
                Online Admission
              </Link>
            </div>
          </div>
        </footer>
      )}

      {/* ─────────────────────────────────────────────
          12. INTERACTIVE QUICK CHALLAN GENERATOR MODAL
      ───────────────────────────────────────────── */}
      {challanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 relative animate-fadeIn border border-slate-200">
            <button
              onClick={() => {
                setChallanModalOpen(false);
                setChallanSearchResult(null);
                setChallanError("");
                setChallanSearchQuery("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold mb-3">
                <Receipt className="w-7 h-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-extrabold text-[#0A1E3F]">Student Fee Challan Search</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your Roll Number or CNIC to lookup & print your official semester fee challan instantly.
              </p>
            </div>

            <form onSubmit={handleSearchChallan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Roll Number or CNIC
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-BSCS-001 or 54400-0000000-1"
                  value={challanSearchQuery}
                  onChange={(e) => setChallanSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-slate-900 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={searchingChallan}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition-all shadow text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {searchingChallan ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching Database...</span>
                  </>
                ) : (
                  <span>Find Fee Challan</span>
                )}
              </button>
            </form>

            {challanError && (
              <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                ⚠️ {challanError}
              </div>
            )}

            {challanSearchResult && challanSearchResult.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matching Challans Found:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {challanSearchResult.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{ch.challanNumber}</p>
                        <p className="text-slate-500">{ch.applicantName} ({ch.cnic})</p>
                        <p className="text-emerald-700 font-bold mt-0.5">Rs. {ch.amount?.toLocaleString()}/-</p>
                      </div>

                      <Link
                        href={`/print/challan/${ch.id}`}
                        target="_blank"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-2 rounded-lg shrink-0 shadow-sm transition-colors flex items-center gap-1"
                      >
                        <span>Print</span>
                        <span>🖨️</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
