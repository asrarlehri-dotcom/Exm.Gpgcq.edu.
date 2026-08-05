import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// All application modules
const MODULES = [
  "INTERMEDIATE.ADMISSIONS", "INTERMEDIATE.STUDENTS", "INTERMEDIATE.FEES",
  "INTERMEDIATE.ATTENDANCE", "INTERMEDIATE.TIMETABLE", "INTERMEDIATE.FACULTY",
  "INTERMEDIATE.REPORTS",
  "BS.ADMISSIONS", "BS.ACADEMIC_SETUP", "BS.STUDENTS", "BS.COURSES",
  "BS.ENROLLMENTS", "BS.FEES", "BS.ATTENDANCE", "BS.TIMETABLE", "BS.EXAMS",
  "BS.MARKS", "BS.RESULTS", "BS.GPA_CGPA", "BS.PROMOTIONS", "BS.DMC",
  "BS.TRANSCRIPT", "BS.GAZETTE", "BS.STUDENT_ACTIONS", "BS.GRADUATION",
  "ADMIN.USERS", "ADMIN.PERMISSIONS", "ADMIN.AUDIT_LOGS", "ADMIN.SETTINGS",
];

const ACTIONS = [
  "VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT", "DOWNLOAD", "EXPORT", "APPROVE", "LOCK"
];

// Default permissions per role
// Format: { role: { module: [actions] } }
const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  GUEST: {
    "INTERMEDIATE.ADMISSIONS": ["VIEW"],
    "BS.ADMISSIONS": ["VIEW"],
  },
  BS_CONTROLLER: {
    "BS.ADMISSIONS": ["VIEW", "ADD", "EDIT", "DELETE", "APPROVE"],
    "BS.ACADEMIC_SETUP": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.STUDENTS": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.COURSES": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.ENROLLMENTS": ["VIEW", "ADD", "EDIT", "DELETE"],
    "BS.FEES": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT"],
    "BS.ATTENDANCE": ["VIEW", "EXPORT"],
    "BS.TIMETABLE": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE", "PRINT"],
    "BS.EXAMS": ["VIEW", "ADD", "EDIT", "DELETE", "GENERATE"],
    "BS.MARKS": ["VIEW", "ADD", "EDIT", "LOCK"],
    "BS.RESULTS": ["VIEW", "GENERATE", "LOCK", "PRINT", "DOWNLOAD", "EXPORT"],
    "BS.GPA_CGPA": ["VIEW", "GENERATE"],
    "BS.PROMOTIONS": ["VIEW", "ADD", "EDIT", "APPROVE"],
    "BS.DMC": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.TRANSCRIPT": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.GAZETTE": ["VIEW", "GENERATE", "PRINT", "DOWNLOAD"],
    "BS.STUDENT_ACTIONS": ["VIEW", "ADD", "EDIT", "APPROVE"],
    "BS.GRADUATION": ["VIEW", "GENERATE", "APPROVE"],
    "ADMIN.AUDIT_LOGS": ["VIEW"],
  },
  BS_FACULTY: {
    "BS.STUDENTS": ["VIEW"],
    "BS.COURSES": ["VIEW"],
    "BS.ATTENDANCE": ["VIEW", "ADD", "EDIT"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.MARKS": ["VIEW", "ADD", "EDIT"],
    "BS.RESULTS": ["VIEW"],
  },
  INTER_FACULTY: {
    "INTERMEDIATE.STUDENTS": ["VIEW"],
    "INTERMEDIATE.ATTENDANCE": ["VIEW", "ADD", "EDIT"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
    "INTERMEDIATE.FEES": ["VIEW"],
  },
  PRINCIPAL: {
    // Principal: read-only across everything
    "INTERMEDIATE.ADMISSIONS": ["VIEW"],
    "INTERMEDIATE.STUDENTS": ["VIEW"],
    "INTERMEDIATE.FEES": ["VIEW"],
    "INTERMEDIATE.ATTENDANCE": ["VIEW"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
    "INTERMEDIATE.FACULTY": ["VIEW"],
    "INTERMEDIATE.REPORTS": ["VIEW", "PRINT", "DOWNLOAD", "EXPORT"],
    "BS.ADMISSIONS": ["VIEW"],
    "BS.ACADEMIC_SETUP": ["VIEW"],
    "BS.STUDENTS": ["VIEW"],
    "BS.COURSES": ["VIEW"],
    "BS.ENROLLMENTS": ["VIEW"],
    "BS.FEES": ["VIEW"],
    "BS.ATTENDANCE": ["VIEW"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.MARKS": ["VIEW"],
    "BS.RESULTS": ["VIEW"],
    "BS.GPA_CGPA": ["VIEW"],
    "BS.PROMOTIONS": ["VIEW"],
    "BS.DMC": ["VIEW", "PRINT"],
    "BS.TRANSCRIPT": ["VIEW", "PRINT"],
    "BS.GAZETTE": ["VIEW", "PRINT"],
    "BS.STUDENT_ACTIONS": ["VIEW"],
    "BS.GRADUATION": ["VIEW"],
    "ADMIN.AUDIT_LOGS": ["VIEW"],
  },
  STUDENT: {
    "BS.COURSES": ["VIEW"],
    "BS.TIMETABLE": ["VIEW"],
    "BS.EXAMS": ["VIEW"],
    "BS.RESULTS": ["VIEW"],
    "BS.GPA_CGPA": ["VIEW"],
    "BS.DMC": ["VIEW", "DOWNLOAD"],
    "BS.TRANSCRIPT": ["VIEW", "DOWNLOAD"],
    "INTERMEDIATE.TIMETABLE": ["VIEW"],
  },
};

async function main() {
  console.log("🌱 Start seeding...");

  // ─── Create Super Admin ───────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@college.edu" },
    update: {},
    create: {
      email: "admin@college.edu",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // ─── Create demo users for each role ────────────────────────────────
  const demoUsers = [
    { email: "controller@college.edu", name: "BS Controller",     role: "BS_CONTROLLER" },
    { email: "bsfaculty@college.edu",  name: "BS Faculty",        role: "BS_FACULTY" },
    { email: "interfaculty@college.edu", name: "Inter Faculty",   role: "INTER_FACULTY" },
    { email: "principal@college.edu",  name: "Principal",         role: "PRINCIPAL" },
  ];

  for (const u of demoUsers) {
    const pw = await bcrypt.hash("demo123", 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, password: pw, role: u.role },
    });
    console.log(`✅ ${u.role}: ${u.email}`);
  }

  // ─── Seed Permissions & RolePermissions ─────────────────────────────
  console.log("\n📋 Seeding permissions...");
  
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action, description: `${module} - ${action}` },
      });
    }
  }
  console.log(`✅ Created ${MODULES.length * ACTIONS.length} permission entries`);

  // Seed RolePermissions
  const roles = Object.keys(DEFAULT_PERMISSIONS);
  for (const role of roles) {
    const modulePerms = DEFAULT_PERMISSIONS[role];
    for (const [module, actions] of Object.entries(modulePerms)) {
      for (const action of ACTIONS) {
        const permission = await prisma.permission.findUnique({
          where: { module_action: { module, action } },
        });
        if (!permission) continue;

        const isGranted = actions.includes(action);
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role, permissionId: permission.id } },
          update: { isGranted },
          create: { role, permissionId: permission.id, isGranted },
        });
      }
    }
  }
  // SUPER_ADMIN gets everything (don't store in DB — handled in code)
  console.log(`✅ RolePermissions seeded for: ${roles.join(", ")}`);

  // ─── Seed sample departments & programs ──────────────────────────────
  console.log("\n🏛️  Seeding departments & programs...");

  const csDept = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: { name: "Computer Science", code: "CS", hodName: "Dr. Ahmed" },
  });

  const engDept = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "English", code: "ENG", hodName: "Dr. Sara" },
  });

  const interDept = await prisma.department.upsert({
    where: { code: "INTER" },
    update: {},
    create: { name: "Intermediate", code: "INTER", hodName: "Mr. Tariq" },
  });

  // BS Programs
  const bsCS = await prisma.program.upsert({
    where: { code: "BSCS" },
    update: {},
    create: {
      name: "BS Computer Science", code: "BSCS",
      educationLevel: "BS", departmentId: csDept.id,
    },
  });

  const bsEng = await prisma.program.upsert({
    where: { code: "BSE" },
    update: {},
    create: {
      name: "BS English", code: "BSE",
      educationLevel: "BS", departmentId: engDept.id,
    },
  });

  // Intermediate Programs
  const fsc = await prisma.program.upsert({
    where: { code: "FSC" },
    update: {},
    create: {
      name: "F.Sc (Pre-Engineering / Pre-Medical)", code: "FSC",
      educationLevel: "INTERMEDIATE", departmentId: interDept.id,
    },
  });

  const fa = await prisma.program.upsert({
    where: { code: "FA" },
    update: {},
    create: {
      name: "F.A (Humanities)", code: "FA",
      educationLevel: "INTERMEDIATE", departmentId: interDept.id,
    },
  });
  console.log(`✅ Programs: ${bsCS.name}, ${bsEng.name}, ${fsc.name}, ${fa.name}`);

  // Groups for Intermediate
  const preEng = await prisma.group.upsert({
    where: { id: "pre-eng-group" },
    update: {},
    create: {
      id: "pre-eng-group",
      name: "Pre-Engineering",
      programId: fsc.id,
    },
  }).catch(() =>
    prisma.group.findFirst({ where: { name: "Pre-Engineering", programId: fsc.id } }).then((g: any) => g!)
  );

  const preMed = await prisma.group.upsert({
    where: { id: "pre-med-group" },
    update: {},
    create: {
      id: "pre-med-group",
      name: "Pre-Medical",
      programId: fsc.id,
    },
  }).catch(() =>
    prisma.group.findFirst({ where: { name: "Pre-Medical", programId: fsc.id } }).then((g: any) => g!)
  );

  // Seed BS Courses (Semester 1 for BSCS)
  const cs101 = await prisma.course.upsert({
    where: { id: "cs101" },
    update: {},
    create: {
      id: "cs101",
      title: "Introduction to Computing",
      code: "CS-101",
      creditHours: 3,
      semester: 1,
      session: "2024",
      programId: bsCS.id,
      departmentId: csDept.id,
    },
  }).catch(() => prisma.course.findFirst({ where: { code: "CS-101" } }).then((c: any) => c!));

  const math101 = await prisma.course.upsert({
    where: { id: "math101" },
    update: {},
    create: {
      id: "math101",
      title: "Calculus I",
      code: "MATH-101",
      creditHours: 3,
      semester: 1,
      session: "2024",
      programId: bsCS.id,
      departmentId: csDept.id,
    },
  }).catch(() => prisma.course.findFirst({ where: { code: "MATH-101" } }).then((c: any) => c!));

  console.log(`✅ Courses seeded`);
  console.log("\n✅ Seeding completed!\n");
  console.log("─────────────────────────────────────────");
  console.log("Demo Login Credentials:");
  console.log("  Super Admin:   admin@college.edu   / admin123");
  console.log("  BS Controller: controller@college.edu / demo123");
  console.log("  BS Faculty:    bsfaculty@college.edu  / demo123");
  console.log("  Inter Faculty: interfaculty@college.edu / demo123");
  console.log("  Principal:     principal@college.edu / demo123");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
