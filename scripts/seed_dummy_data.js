const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Starting dummy data generation...');

  // 1. Create Academic Session
  const sessionName = "Fall 2026";
  let academicSession = await prisma.academicSession.findUnique({
    where: { name: sessionName }
  });
  if (!academicSession) {
    academicSession = await prisma.academicSession.create({
      data: {
        name: sessionName,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-01-15'),
        status: "ACTIVE"
      }
    });
    console.log(`Created Academic Session: ${sessionName}`);
  }

  const departments = await prisma.department.findMany();
  const programs = await prisma.program.findMany();
  
  if (programs.length === 0) {
    console.log("No programs found! Run seed_syllabi.js first.");
    return;
  }

  // 2. Generate Faculty
  const facultyList = [];
  for (const dept of departments) {
    for (let i = 0; i < 3; i++) { // 3 teachers per dept
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'password123',
          role: 'TEACHER',
          isActive: true
        }
      });
      const faculty = await prisma.faculty.create({
        data: {
          userId: user.id,
          departmentId: dept.id,
          designation: "Assistant Professor"
        }
      });
      facultyList.push(faculty);
    }
    console.log(`Created 3 Faculty members for ${dept.name}`);
    await sleep(500); // Prevent connection pool limits
  }

  // 3. Generate Students, Admissions, Enrollments, Marks, Results
  for (const program of programs) {
    console.log(`Generating data for ${program.name}...`);
    
    // Max 50 students per program
    for (let s = 1; s <= 50; s++) {
      // Semester logic: 25 in Sem 1, 25 in Sem 2
      const semester = s <= 25 ? 1 : 2; 
      
      const user = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'password123',
          role: 'STUDENT',
          isActive: true
        }
      });

      const student = await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber: `BS-${program.code.split('-')[1]}-${faker.string.numeric(5)}`,
          programId: program.id,
          currentSemester: semester,
          session: "2025-2026",
          educationLevel: "BS",
          fatherName: faker.person.fullName({ sex: 'male' }),
          contactNumber: faker.phone.number(),
          residentAddress: faker.location.streetAddress(),
          cnic: faker.string.numeric(13)
        }
      });

      // Admission Record
      await prisma.admission.create({
        data: {
          studentName: user.name,
          fatherName: student.fatherName,
          cnic: student.cnic,
          dateOfBirth: faker.date.birthdate({ min: 18, max: 24, mode: 'age' }),
          contactNumber: student.contactNumber,
          email: user.email,
          educationLevel: "BS",
          programId: program.id,
          session: "2025-2026",
          status: "APPROVED",
          gender: faker.person.sex().toUpperCase()
        }
      });

      // Enrollments and Marks
      const courses = await prisma.course.findMany({
        where: { programId: program.id, semester: semester }
      });

      for (const course of courses) {
        // Enroll
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            semester: semester,
            status: "ACTIVE"
          }
        });

        // Fake Marks (Simulating passing and some failing)
        // Ensure most pass, some fail (obtained < 50 for BS usually means fail, but random is fine)
        const totalMarks = 100;
        const obtained = faker.number.int({ min: 40, max: 95 }); // mostly pass

        await prisma.marks.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            assignmentMarks: obtained * 0.2,
            midtermMarks: obtained * 0.3,
            finalMarks: obtained * 0.5,
            obtainedMarks: obtained,
            totalMarks: totalMarks,
            status: "SAVED",
            isLocked: true
          }
        });
      }

      // Result summary for the semester
      // Note: Full logic is in SGPA calculator, we just seed a dummy row for UI
      await prisma.result.create({
        data: {
          studentId: student.id,
          semester: semester,
          gpa: faker.number.float({ min: 1.5, max: 4.0, fractionDigits: 2 }),
          cgpa: semester === 1 ? null : faker.number.float({ min: 1.5, max: 4.0, fractionDigits: 2 }),
          status: "PROMOTED",
          isLocked: true
        }
      });

      if (s % 10 === 0) {
        console.log(`  Created ${s} students for ${program.name}`);
        await sleep(1000); // Sleep every 10 students
      }
    }
    
    // 4. Timetable and Datesheet for this program's Semester 1
    const s1Courses = await prisma.course.findMany({
      where: { programId: program.id, semester: 1 }
    });

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    let dayIdx = 0;

    for (let i = 0; i < s1Courses.length; i++) {
      const course = s1Courses[i];
      const fac = facultyList[i % facultyList.length];

      // Timetable
      await prisma.timetable.create({
        data: {
          session: "2025-2026",
          semester: 1,
          dayOfWeek: days[dayIdx % days.length],
          startTime: "09:00 AM",
          endTime: "10:30 AM",
          educationLevel: "BS",
          generationMode: "AUTO",
          status: "PUBLISHED",
          isFinalized: true,
          courseId: course.id,
          facultyId: fac.id,
          programId: program.id,
          departmentId: course.departmentId
        }
      });
      dayIdx++;

      // Datesheet
      const examDate = new Date();
      examDate.setDate(examDate.getDate() + i + 1); // Future dates

      await prisma.datesheet.create({
        data: {
          session: "2025-2026",
          semester: 1,
          examType: "FINAL_TERM",
          date: examDate,
          startTime: "09:00 AM",
          endTime: "12:00 PM",
          generationMode: "MANUAL",
          status: "PUBLISHED",
          isFinalized: true,
          courseId: course.id,
          programId: program.id,
          departmentId: course.departmentId
        }
      });
    }

    console.log(`Finished ${program.name}`);
  }

  console.log('Dummy data generation completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
