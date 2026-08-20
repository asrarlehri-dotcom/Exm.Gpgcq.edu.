import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("\n================== DATABASE DUMMY DATA AUDIT ==================");
  console.log("👥 Users:             ", await prisma.user.count());
  console.log("🏛️ Departments:       ", await prisma.department.count());
  console.log("🎓 Programs:          ", await prisma.program.count());
  console.log("📚 Courses:           ", await prisma.course.count());
  console.log("📑 Syllabus Versions: ", await prisma.syllabusVersion.count());
  console.log("👨‍🏫 Faculty:           ", await prisma.faculty.count());
  console.log("🎓 Students:          ", await prisma.student.count());
  console.log("   • Graduated:       ", await prisma.studentStatus.count({ where: { statusType: "GRADUATION" } }));
  console.log("   • Frozen:          ", await prisma.studentStatus.count({ where: { statusType: "FREEZE" } }));
  console.log("   • Quit/Dropout:    ", await prisma.studentStatus.count({ where: { statusType: { in: ["QUIT", "DROPOUT"] } } }));
  console.log("   • Bridging (5th):  ", await prisma.student.count({ where: { bsAdmissionType: "BRIDGING_5TH" } }));
  console.log("   • Migration:       ", await prisma.student.count({ where: { bsAdmissionType: "MIGRATION" } }));
  console.log("   • Intermediate:    ", await prisma.student.count({ where: { educationLevel: "INTERMEDIATE" } }));
  console.log("📝 Enrollments:       ", await prisma.enrollment.count());
  console.log("📊 Marks:             ", await prisma.marks.count());
  console.log("🏆 Results:           ", await prisma.result.count());
  console.log("📈 Promotions:        ", await prisma.promotion.count());
  console.log("📅 Timetables:        ", await prisma.timetable.count());
  console.log("📆 Datesheets:        ", await prisma.datesheet.count());
  console.log("🛡️ Exam Duties:       ", await prisma.examDuty.count());
  console.log("🧾 Challans:          ", await prisma.challan.count());
  console.log("   • Paid Challans:   ", await prisma.challan.count({ where: { status: "PAID" } }));
  console.log("   • Pending (Dues):  ", await prisma.challan.count({ where: { status: "PENDING" } }));
  console.log("💳 Fee Records:       ", await prisma.fee.count());
  console.log("   • Paid Fees:       ", await prisma.fee.count({ where: { status: "PAID" } }));
  console.log("   • Unpaid (Dues):   ", await prisma.fee.count({ where: { status: "UNPAID" } }));
  console.log("📋 Admissions:        ", await prisma.admission.count());
  console.log("   • Approved:        ", await prisma.admission.count({ where: { status: "APPROVED" } }));
  console.log("   • Pending:         ", await prisma.admission.count({ where: { status: "PENDING" } }));
  console.log("   • Rejected:        ", await prisma.admission.count({ where: { status: "REJECTED" } }));
  console.log("⏱️ Attendance Logs:   ", await prisma.attendance.count());
  console.log("💰 Expenses:          ", await prisma.expense.count());
  console.log("📜 Audit Logs:        ", await prisma.auditLog.count());
  console.log("===============================================================\n");
}

main().finally(() => prisma.$disconnect());
