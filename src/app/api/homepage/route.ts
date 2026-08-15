import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const DEFAULT_HOMEPAGE_SETTINGS: Record<string, string> = {
  // Navigation Header
  HOMEPAGE_HEADER_LOGO_TEXT: "GPCQ",
  HOMEPAGE_HEADER_LOGO_IMAGE: "/logo.png",
  HOMEPAGE_HEADER_SUBTEXT: "SARIAB ROAD, QUETTA • CMS ERP PORTAL",

  // Hero Section
  HOMEPAGE_HERO_SHOW: "true",
  HOMEPAGE_HERO_TITLE: "Government Postgraduate College, Sariab Road, Quetta",
  HOMEPAGE_HERO_SUBTITLE: "A historic institution committed to academic excellence, higher research, and professional student development.",
  HOMEPAGE_HERO_BG_IMAGE: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80",
  HOMEPAGE_HERO_BTN1_TEXT: "Access Dashboard",
  HOMEPAGE_HERO_BTN1_LINK: "/login",
  HOMEPAGE_HERO_BTN2_TEXT: "View Public Notices",
  HOMEPAGE_HERO_BTN2_LINK: "#notices",

  // Stats Section
  HOMEPAGE_STATS_SHOW: "true",
  HOMEPAGE_STATS_MODE: "MANUAL", // "AUTO" or "MANUAL"
  HOMEPAGE_STATS_STUDENTS: "1420",
  HOMEPAGE_STATS_PROGRAMS: "5",
  HOMEPAGE_STATS_FACULTY: "85",
  HOMEPAGE_STATS_COURSES: "85",

  // Leadership Section
  HOMEPAGE_LEADERSHIP_SHOW: "true",
  HOMEPAGE_LEADERSHIP_TITLE: "Administration & Leadership",
  HOMEPAGE_LEADERSHIP_SUBTITLE: "Meet the key leadership guiding the institution toward excellence",
  HOMEPAGE_LEADERSHIP_ITEMS: JSON.stringify([
    {
      id: "lead-1",
      name: "Prof. Dr. Principal Name",
      role: "College Principal",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
      show: true,
    },
    {
      id: "lead-2",
      name: "Prof. Senior Faculty",
      role: "Vice Principal / Registrar",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80",
      show: true,
    },
    {
      id: "lead-3",
      name: "Israr Ahmed Lehri",
      role: "Computer Operator / IT Officer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      show: true,
    },
  ]),

  // Ticker / Latest Notices Bar
  HOMEPAGE_TICKER_SHOW: "true",
  HOMEPAGE_TICKER_BADGE: "SYSTEM NOTICE:",
  HOMEPAGE_TICKER_ITEMS: JSON.stringify([
    {
      id: "tick-dev",
      text: "The project is currently under development by Israr Ahmed (Computer Programmer). Please be patient if you encounter any missing data or errors.",
      link: "#",
      show: true,
    },
    {
      id: "tick-1",
      text: "Elective Subject Examination Guidelines for BS Computer Science",
      link: "#notices",
      show: true,
    },
  ]),

  // Campus Life & Recent Events
  HOMEPAGE_EVENTS_SHOW: "true",
  HOMEPAGE_EVENTS_TITLE: "Campus Life & Recent Events",
  HOMEPAGE_EVENTS_SUBTITLE: "Glances at recent academic sessions, convocations, and student activities",
  HOMEPAGE_EVENTS_ITEMS: JSON.stringify([
    {
      id: "evt-1",
      category: "MAY 2026 • CONVOCATION",
      title: "1st Annual Historic Convocation Ceremony & Gold Medal Distribution",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
      link: "#",
      show: true,
    },
    {
      id: "evt-2",
      category: "JULY 2026 • EXAMINATIONS",
      title: "TERMINAL & Practical Semester Examinations Conducted Successfully",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
      link: "#",
      show: true,
    },
  ]),

  // Official Notices List
  HOMEPAGE_NOTICES_SHOW: "true",
  HOMEPAGE_NOTICES_TITLE: "Official Notices & Announcements",
  HOMEPAGE_NOTICES_ITEMS: JSON.stringify([
    {
      id: "not-1",
      date: "July 31, 2026",
      title: "TERMINAL - Elective Subject Examination Guidelines for BS Computer Science",
      link: "#",
      show: true,
    },
    {
      id: "not-2",
      date: "July 29, 2026",
      title: "TERMINAL - Lab & Practical Schedule Announcement",
      link: "#",
      show: true,
    },
    {
      id: "not-3",
      date: "July 25, 2026",
      title: "Class Timetable Published for the Upcoming Academic Session",
      link: "#",
      show: true,
    },
  ]),

  // Fee Challan Widget
  HOMEPAGE_CHALLAN_WIDGET_SHOW: "true",
  HOMEPAGE_CHALLAN_WIDGET_TITLE: "Fee Challan Portal",
  HOMEPAGE_CHALLAN_WIDGET_DESC: "Students can generate and download their semester fee challan instantly using their Roll Number.",
  HOMEPAGE_CHALLAN_WIDGET_BTN: "Generate Fee Challan",

  // Quick Links Widget
  HOMEPAGE_QUICK_LINKS_SHOW: "true",
  HOMEPAGE_QUICK_LINKS_TITLE: "Quick Links",
  HOMEPAGE_QUICK_LINKS_ITEMS: JSON.stringify([
    { id: "ql-1", icon: "📄", label: "Admission Policy & Guidelines", link: "/admission", show: true },
    { id: "ql-2", icon: "🏛️", label: "Academic Calendar 2026", link: "#", show: true },
    { id: "ql-3", icon: "🔍", label: "Verify Student Degree / Result", link: "#", show: true },
    { id: "ql-4", icon: "📞", label: "Contact Support Team", link: "#", show: true },
  ]),

  // Footer
  HOMEPAGE_FOOTER_SHOW: "true",
  HOMEPAGE_FOOTER_COPYRIGHT: "© 2026 Government Postgraduate College, Sariab Road, Quetta. All Rights Reserved.",
};

export async function GET() {
  try {
    // Seed default homepage settings into SystemSetting table if missing
    for (const [key, value] of Object.entries(DEFAULT_HOMEPAGE_SETTINGS)) {
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      if (!existing) {
        await prisma.systemSetting.create({
          data: { key, value },
        });
      }
    }

    // Fetch all system settings
    const settingsList = await prisma.systemSetting.findMany();
    const settingsMap = settingsList.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Live DB stats counts
    const liveStats = {
      students: await prisma.student.count({ where: { isActive: true } }),
      programs: await prisma.program.count({ where: { isActive: true } }),
      faculty: await prisma.faculty.count({ where: { isActive: true } }),
      courses: await prisma.course.count({ where: { isActive: true } }),
    };

    return NextResponse.json({
      settings: settingsMap,
      liveStats,
    });
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    return NextResponse.json({ error: "Failed to load homepage configuration" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const body = await request.json(); // expected key-value pairs object

    for (const [key, value] of Object.entries(body)) {
      const strVal = typeof value === "object" ? JSON.stringify(value) : String(value);
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: strVal },
        create: { key, value: strVal },
      });
    }

    return NextResponse.json({ success: true, message: "Homepage settings updated successfully" });
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    return NextResponse.json({ error: "Failed to save homepage settings" }, { status: 500 });
  }
}
