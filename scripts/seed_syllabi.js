const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const programsData = [
  {
    name: "BS English",
    code: "BS-ENG",
    level: "BS",
    departmentName: "Department of English",
    courses: [
      // Semester 1
      { title: "Functional English", code: "Eng-501", creditHours: 3, semester: 1 },
      { title: "Introduction to Linguistics", code: "ELing-502", creditHours: 3, semester: 1 },
      { title: "Brief History of English Literature I", code: "ELit-501", creditHours: 3, semester: 1 },
      { title: "Introduction to Philosophy", code: "Phil-501", creditHours: 3, semester: 1 },
      { title: "Introduction to Psychology", code: "Psy-501", creditHours: 3, semester: 1 },
      { title: "Ideology and Constitution of Pakistan", code: "PS-501", creditHours: 2, semester: 1 },
      // Semester 2
      { title: "Expository Writing", code: "Eng-502", creditHours: 3, semester: 2 },
      { title: "Phonetics and Phonology", code: "ELing-503", creditHours: 3, semester: 2 },
      { title: "Brief History of English Literature (II)", code: "ELit-502", creditHours: 3, semester: 2 },
      { title: "Civic and Community Engagement", code: "CIV-501", creditHours: 3, semester: 2 },
      { title: "Introduction to Sociology", code: "SoC-501", creditHours: 2, semester: 2 },
      { title: "Islamic Studies", code: "ISL-501", creditHours: 2, semester: 2 },
      // Semester 3
      { title: "Introduction to History", code: "HIS-501", creditHours: 3, semester: 3 },
      { title: "Morphology and Syntax", code: "ELing-503", creditHours: 3, semester: 3 },
      { title: "Introduction to English Literature (1): Poetry & Short Stories", code: "ELit-505", creditHours: 3, semester: 3 },
      { title: "Entreneurship", code: "NS-501", creditHours: 2, semester: 3 },
      { title: "Introduction to International Relation", code: "IR-501", creditHours: 3, semester: 3 },
      { title: "Introduction to Computer", code: "CS-502", creditHours: 3, semester: 3 },
      // Semester 4
      { title: "Environmental Science", code: "NS-501-E", creditHours: 3, semester: 4 },
      { title: "Semantics & Pragmatics", code: "ELing-504", creditHours: 3, semester: 4 },
      { title: "Introduction to Drama", code: "ELit-506", creditHours: 3, semester: 4 },
      { title: "Introduction to English Literature (II) Novel & Prose", code: "ELit-507", creditHours: 3, semester: 4 },
      { title: "Human Rights & Citizenship", code: "Eng-501-H", creditHours: 2, semester: 4 },
      { title: "Introduction to Statistics", code: "QR-502", creditHours: 2, semester: 4 },
      // Semester 5
      { title: "Psycholinguistics", code: "ELing-602", creditHours: 3, semester: 5 },
      { title: "Sociolinguistics", code: "ELing-612", creditHours: 3, semester: 5 },
      { title: "Classical Literary Criticism", code: "ELit-603", creditHours: 3, semester: 5 },
      { title: "World Literature in English", code: "ELit-604", creditHours: 3, semester: 5 },
      { title: "Pakistani Literature", code: "ELit-605", creditHours: 3, semester: 5 },
      // Semester 6
      { title: "Methods of English Language Teaching", code: "ELing-614", creditHours: 3, semester: 6 },
      { title: "World Englishes", code: "ELing-623", creditHours: 3, semester: 6 },
      { title: "Modern Literary Criticism", code: "ELit-606", creditHours: 3, semester: 6 },
      { title: "Introduction to American Literature", code: "ELit-607", creditHours: 3, semester: 6 },
      { title: "Research Methodology", code: "RM-608", creditHours: 3, semester: 6 },
      // Semester 7
      { title: "Syllabus Design and Material Development", code: "ELing-617", creditHours: 3, semester: 7 },
      { title: "African American Literature", code: "ELit-609", creditHours: 3, semester: 7 },
      { title: "Modern & Contemporary Poets", code: "ELit-610", creditHours: 3, semester: 7 },
      { title: "Continental Literature", code: "ELit-611", creditHours: 3, semester: 7 },
      { title: "Capstone Project", code: "RP-615", creditHours: 3, semester: 7 },
      // Semester 8
      { title: "Language Testing and Assessment", code: "ELing-611", creditHours: 3, semester: 8 },
      { title: "English Language Teaching in Pakistan", code: "ELing-608", creditHours: 3, semester: 8 },
      { title: "Modern Drama", code: "ELit-613", creditHours: 3, semester: 8 },
      { title: "Emerging Forms of Literature", code: "ELit-614", creditHours: 3, semester: 8 },
      { title: "Internship", code: "ELit-620", creditHours: 3, semester: 8 },
    ]
  },
  {
    name: "BS Economics",
    code: "BS-ECO",
    level: "BS",
    departmentName: "Department of Economics",
    courses: [
      // Semester 1
      { title: "Functional English", code: "ENG-501", creditHours: 3, semester: 1 },
      { title: "Introduction to Economics", code: "ECON-511", creditHours: 3, semester: 1 },
      { title: "Islamic studies / Ethics", code: "ISL-501", creditHours: 2, semester: 1 },
      { title: "Quantitative Reasoning-I", code: "QR-501", creditHours: 3, semester: 1 },
      { title: "Introduction to Computer", code: "CS-501", creditHours: 3, semester: 1 },
      { title: "Principles of Macroeconomics", code: "ECON-512", creditHours: 3, semester: 1 },
      // Semester 2
      { title: "Expository Writing", code: "ENG-502", creditHours: 3, semester: 2 },
      { title: "Pakistan Studies", code: "PS-614", creditHours: 2, semester: 2 },
      { title: "Intermediate Microeconomics", code: "ECON-521", creditHours: 3, semester: 2 },
      { title: "Quantitative Reasoning-II", code: "QR-502", creditHours: 3, semester: 2 },
      { title: "Statistics-I", code: "ECON-523", creditHours: 3, semester: 2 },
      { title: "History", code: "HIS-501", creditHours: 2, semester: 2 },
      // Semester 3
      { title: "International Relations", code: "IR-617", creditHours: 3, semester: 3 },
      { title: "Intermediate Macroeconomics", code: "ECON-524", creditHours: 3, semester: 3 },
      { title: "Introduction to Environmental Sciences", code: "ECON-622", creditHours: 3, semester: 3 },
      { title: "Statistics-II", code: "ECON-625", creditHours: 3, semester: 3 },
      { title: "Political Science", code: "PS-627", creditHours: 3, semester: 3 },
      { title: "Entrepreneurship", code: "ENT-508", creditHours: 2, semester: 3 },
      // Semester 4
      { title: "Development Economics", code: "ECON-522", creditHours: 3, semester: 4 },
      { title: "Mathematical Economics-I", code: "ECON-633", creditHours: 3, semester: 4 },
      { title: "Comparative Economic Systems", code: "ECON-643", creditHours: 3, semester: 4 },
      { title: "World Economic History", code: "ECON-637", creditHours: 3, semester: 4 },
      { title: "Ideology and Constitution of Pakistan", code: "PS-501-E", creditHours: 2, semester: 4 },
      { title: "Civics", code: "SOC-628", creditHours: 2, semester: 4 },
      // Semester 5
      { title: "Microeconomics Theory", code: "ECON-631", creditHours: 3, semester: 5 },
      { title: "Macroeconomics Theory", code: "ECON-632", creditHours: 3, semester: 5 },
      { title: "Economic Growth", code: "ECON-635", creditHours: 3, semester: 5 },
      { title: "Issues in Pakistan Economy", code: "ECON-634", creditHours: 3, semester: 5 },
      { title: "Introduction to Philosophy", code: "PHIL-501", creditHours: 3, semester: 5 },
      { title: "Psychology", code: "PSY-616", creditHours: 3, semester: 5 },
      // Semester 6
      { title: "Introduction to Business Studies", code: "BA-609", creditHours: 3, semester: 6 },
      { title: "Econometrics-I", code: "ECON-636", creditHours: 3, semester: 6 },
      { title: "Economics of Climate Change", code: "ECON-622-C", creditHours: 3, semester: 6 },
      { title: "Managerial Economics", code: "ECON-642", creditHours: 3, semester: 6 },
      { title: "International Trade Theory", code: "ECON-641", creditHours: 3, semester: 6 },
      // Semester 7
      { title: "Islamic Economics", code: "ECON-646", creditHours: 3, semester: 7 },
      { title: "Econometrics-II", code: "ECON-644", creditHours: 3, semester: 7 },
      { title: "Research Methods", code: "ECON-650", creditHours: 3, semester: 7 },
      { title: "Public Sector Economy", code: "ECON-651", creditHours: 3, semester: 7 },
      { title: "Poverty & Income Distribution", code: "ECON-652", creditHours: 3, semester: 7 },
      // Semester 8
      { title: "Entrepreneurial Economics", code: "ECON-645", creditHours: 3, semester: 8 },
      { title: "Regional Trade", code: "ECON-672", creditHours: 3, semester: 8 },
      { title: "Monetary Economics", code: "ECON-647", creditHours: 3, semester: 8 },
      { title: "Agricultural Economics", code: "ECON-676", creditHours: 3, semester: 8 },
      { title: "Capstone Project", code: "ECON-653", creditHours: 3, semester: 8 },
      { title: "Internship / Field Experience", code: "ECON-654", creditHours: 3, semester: 8 },
    ]
  },
  {
    name: "BS Chemistry",
    code: "BS-CHEM",
    level: "BS",
    departmentName: "Department of Chemistry",
    courses: [
      // Semester 1
      { title: "Functional English", code: "ENG-501-C", creditHours: 3, semester: 1 },
      { title: "Introduction to Biology", code: "BOT-502", creditHours: 3, semester: 1 },
      { title: "Appl of ICT", code: "CS-501-C", creditHours: 3, semester: 1 },
      { title: "Mathematics", code: "MATH-501", creditHours: 3, semester: 1 },
      { title: "Essentials of Chemistry", code: "CHEM-501", creditHours: 3, semester: 1 },
      { title: "Inorganic Chemistry-I", code: "CHEM-502", creditHours: 4, semester: 1 },
      // Semester 2
      { title: "Expository Writing", code: "ENG-502-C", creditHours: 3, semester: 2 },
      { title: "Fundamentals of Physics", code: "PHY-500", creditHours: 3, semester: 2 },
      { title: "Intro to Entrepreneurship", code: "ENT-508-C", creditHours: 2, semester: 2 },
      { title: "Quantitative Reasoning-I", code: "QR-501-C", creditHours: 3, semester: 2 },
      { title: "Principles of Chemistry", code: "CHEM-503", creditHours: 3, semester: 2 },
      { title: "Organic Chemistry-I", code: "CHEM-504", creditHours: 4, semester: 2 },
      // Semester 3
      { title: "Fundamentals of Geography", code: "GEOG-501", creditHours: 2, semester: 3 },
      { title: "Ideology of Pakistan", code: "PS-526", creditHours: 2, semester: 3 },
      { title: "Principles of Animal Life", code: "ZOOL-503", creditHours: 3, semester: 3 },
      { title: "Quantitative Reasoning-II", code: "QR-502-C", creditHours: 3, semester: 3 },
      { title: "Environmental Chemistry-I", code: "CHEM-505", creditHours: 3, semester: 3 },
      { title: "Physical Chemistry-I", code: "CHEM-506", creditHours: 4, semester: 3 },
      // Semester 4
      { title: "Statistics", code: "STAT-501", creditHours: 3, semester: 4 },
      { title: "Introduction to History", code: "HIS-501-C", creditHours: 2, semester: 4 },
      { title: "Islamic Studies", code: "ISL-501-C", creditHours: 2, semester: 4 },
      { title: "Civics and Community Engagement", code: "SOC-502-C", creditHours: 2, semester: 4 },
      { title: "Analytical Chemistry-I", code: "CHEM-507", creditHours: 3, semester: 4 },
      { title: "Biochemistry-I", code: "CHEM-508", creditHours: 3, semester: 4 },
      { title: "Applied Chemistry", code: "CHEM-509", creditHours: 3, semester: 4 },
      // Semester 5
      { title: "Inorganic Chemistry-II", code: "CHEM-601", creditHours: 4, semester: 5 },
      { title: "Organic Chemistry-II", code: "CHEM-602", creditHours: 4, semester: 5 },
      { title: "Physical Chemistry-II", code: "CHEM-603", creditHours: 4, semester: 5 },
      { title: "Analytical Chemistry-II", code: "CHEM-604", creditHours: 4, semester: 5 },
      { title: "Inorganic Chemistry-III", code: "CHEM-606", creditHours: 4, semester: 5 },
      // Semester 6
      { title: "Organic Chemistry-III", code: "CHEM-607", creditHours: 4, semester: 6 },
      { title: "Physical Chemistry-III", code: "CHEM-608", creditHours: 4, semester: 6 },
      { title: "Analytical Chemistry-III", code: "CHEM-609", creditHours: 4, semester: 6 },
      // Semester 7 (Inorganic)
      { title: "Inorganic Chemistry-IV", code: "CHEM-611", creditHours: 3, semester: 7 },
      { title: "Inorganic Chemistry-V", code: "CHEM-612", creditHours: 3, semester: 7 },
      { title: "Inorganic Chemistry-VI", code: "CHEM-613", creditHours: 3, semester: 7 },
      { title: "Inorganic Chemistry Lab-I", code: "CHEM-614", creditHours: 1, semester: 7 },
      { title: "Research Methodology", code: "CHEM-615", creditHours: 3, semester: 7 },
      { title: "Internship", code: "CHEM-616", creditHours: 3, semester: 7 },
      // Semester 8 (Inorganic)
      { title: "Inorganic Chemistry-VII", code: "CHEM-633", creditHours: 3, semester: 8 },
      { title: "Inorganic Chemistry-VIII", code: "CHEM-634", creditHours: 3, semester: 8 },
      { title: "Inorganic Chemistry-IX", code: "CHEM-635", creditHours: 3, semester: 8 },
      { title: "Inorganic Chemistry Lab-II", code: "CHEM-636", creditHours: 1, semester: 8 },
      { title: "Environmental Chemistry-II", code: "CHEM-637", creditHours: 3, semester: 8 },
      { title: "Capstone Project", code: "CHEM-638", creditHours: 3, semester: 8 },
    ]
  },
  {
    name: "B.Ed (4 Years)",
    code: "BS-BED",
    level: "BS",
    departmentName: "Department of Education",
    courses: [
      // Semester 1
      { title: "Functional English", code: "ENG-501-E", creditHours: 3, semester: 1 },
      { title: "Islamic Studies", code: "IS-501", creditHours: 2, semester: 1 },
      { title: "Introduction to Biology", code: "BOT-502-E", creditHours: 3, semester: 1 },
      { title: "Child Development", code: "EDU-511", creditHours: 3, semester: 1 },
      { title: "General Methods of Teaching", code: "EDU-512", creditHours: 3, semester: 1 },
      { title: "Urdu", code: "UR-500", creditHours: 3, semester: 1 },
      // Semester 2
      { title: "Class Room Management", code: "EDU-521", creditHours: 3, semester: 2 },
      { title: "Expository Writing", code: "ENG-502-E", creditHours: 3, semester: 2 },
      { title: "Ideology and Constitution of Pak", code: "PS-526-E", creditHours: 2, semester: 2 },
      { title: "Computer Literacy", code: "EDU-522", creditHours: 3, semester: 2 },
      { title: "Quantitative Reasoning 1", code: "QR-501-E", creditHours: 3, semester: 2 },
      { title: "Intro to Political Science", code: "POL-SC-501", creditHours: 3, semester: 2 },
      // Semester 3
      { title: "Arts, Crafts and Calligraphy", code: "EDU-531", creditHours: 3, semester: 3 },
      { title: "Practicum-I", code: "EDU-532", creditHours: 3, semester: 3 },
      { title: "Civics and Community Engagement", code: "SOC-502-E", creditHours: 2, semester: 3 },
      { title: "Introduction to Philosophy", code: "PHIL-501-E", creditHours: 2, semester: 3 },
      { title: "Introduction to Sociology", code: "SOC-501-E", creditHours: 2, semester: 3 },
      { title: "ICT in Education", code: "CS-501-E", creditHours: 3, semester: 3 },
      // Semester 4
      { title: "Introduction to Mass Communication", code: "MS-501", creditHours: 3, semester: 4 },
      { title: "Quantitative Reasoning -II", code: "QR-502-E", creditHours: 3, semester: 4 },
      { title: "School, Community and Teacher", code: "EDU-541", creditHours: 3, semester: 4 },
      { title: "Entrepreneurship", code: "ENT-508-E", creditHours: 2, semester: 4 },
      { title: "Classroom Assessment", code: "EDU-542", creditHours: 3, semester: 4 },
      { title: "Teaching practice- II", code: "EDU-543", creditHours: 3, semester: 4 },
      // Semester 5
      { title: "English-III (Technical Writing)", code: "EDU-651", creditHours: 3, semester: 5 },
      { title: "Foundations of Education", code: "EDU-652", creditHours: 3, semester: 5 },
      { title: "Content Course- Science", code: "EDU-653", creditHours: 3, semester: 5 },
      { title: "Curriculum Development", code: "EDU-654", creditHours: 3, semester: 5 },
      { title: "Educational Psychology", code: "EDU-655", creditHours: 3, semester: 5 },
      // Semester 6
      { title: "Contemporary Issues and Trends in Edu", code: "EDU-661", creditHours: 3, semester: 6 },
      { title: "Content Course- Urdu", code: "EDU-662", creditHours: 3, semester: 6 },
      { title: "Content Course- Social Studies", code: "EDU-663", creditHours: 3, semester: 6 },
      { title: "Comparative Education", code: "EDU-664", creditHours: 3, semester: 6 },
      { title: "Introduction to Guidance and Counseling", code: "EDU-665", creditHours: 3, semester: 6 },
      // Semester 7
      { title: "Content Course- Islamiat", code: "EDU-671", creditHours: 3, semester: 7 },
      { title: "Pedagogy of English", code: "EDU-672", creditHours: 3, semester: 7 },
      { title: "Pedagogy of Science", code: "EDU-673", creditHours: 3, semester: 7 },
      { title: "Research Methods in Education", code: "EDU-674", creditHours: 3, semester: 7 },
      { title: "Teaching Practice", code: "EDU-675", creditHours: 3, semester: 7 },
      // Semester 8
      { title: "School Management", code: "EDU-681", creditHours: 3, semester: 8 },
      { title: "Test Development and Evaluation", code: "EDU-682", creditHours: 3, semester: 8 },
      { title: "Teaching Practice II", code: "EDU-683", creditHours: 3, semester: 8 },
      { title: "Capstone Project", code: "EDU-684", creditHours: 3, semester: 8 },
      { title: "Research Project", code: "EDU-685", creditHours: 3, semester: 8 },
    ]
  },
  {
    name: "BS Urdu",
    code: "BS-URD",
    level: "BS",
    departmentName: "Department of Urdu",
    courses: [
      // Semester 1
      { title: "Urdu Zaban Tashkeel o Irtiqa", code: "URD-500", creditHours: 3, semester: 1 },
      { title: "Sheri Asnaf: Taaruf", code: "URD-501", creditHours: 3, semester: 1 },
      // Semester 2
      { title: "Sheri Asnaf (Hissa Daum)", code: "URD-502", creditHours: 3, semester: 2 },
      // Semester 3
      { title: "Nasri Asnaf", code: "URD-503", creditHours: 3, semester: 3 },
      // Semester 4
      { title: "Tehreer o Insha", code: "URD-504", creditHours: 3, semester: 4 },
      // Semester 5
      { title: "Nasri Asnaf (Hissa Daum)", code: "URD-600", creditHours: 3, semester: 5 },
      { title: "Urdu Zaban Qawaid", code: "URD-601", creditHours: 3, semester: 5 },
      { title: "Urdu Dastan aur Novel", code: "URD-604", creditHours: 3, semester: 5 },
      { title: "Urdu Ghazal", code: "URD-5605", creditHours: 3, semester: 5 },
      { title: "Tareekh e Adab Urdu", code: "URD-606", creditHours: 3, semester: 5 },
      // Semester 6
      { title: "Bayan o Badi", code: "URD-602", creditHours: 3, semester: 6 },
      { title: "Adabi Istalahat", code: "URD-603", creditHours: 3, semester: 6 },
      { title: "Urdu Afsana aur Drama", code: "URD-607", creditHours: 3, semester: 6 },
      { title: "Urdu Novel", code: "URD-608", creditHours: 3, semester: 6 },
      { title: "Urdu Nazm", code: "URD-609", creditHours: 3, semester: 6 },
      { title: "Urdu Nasr ke Asaleeb", code: "URD-610", creditHours: 3, semester: 6 },
      // Semester 7
      { title: "Lisaniyat", code: "URD-611", creditHours: 3, semester: 7 },
      { title: "Usool-e-Tahqeeq", code: "URD-612", creditHours: 3, semester: 7 },
      // Semester 8
      { title: "Research in Urdu", code: "URD-613", creditHours: 3, semester: 8 },
      { title: "Research in Urdu (Hissa Daum)", code: "URD-614", creditHours: 3, semester: 8 },
      { title: "Naye Tanqeedi Mubahis", code: "URD-615", creditHours: 3, semester: 8 },
      { title: "Iqbal ka Khusoosi Mutala", code: "URD-616", creditHours: 3, semester: 8 },
    ]
  }
];

async function main() {
  console.log('Starting seed process...');
  
  for (const prog of programsData) {
    // 1. Ensure Department exists
    let department = await prisma.department.findFirst({
      where: { name: prog.departmentName }
    });
    
    if (!department) {
      department = await prisma.department.create({
        data: {
          name: prog.departmentName,
          code: prog.code.split('-')[1] // e.g. ENG, ECO
        }
      });
      console.log(`Created Department: ${department.name}`);
    }

    // 2. Ensure Program exists
    let program = await prisma.program.findFirst({
      where: { name: prog.name }
    });

    if (!program) {
      program = await prisma.program.create({
        data: {
          name: prog.name,
          code: prog.code,
          educationLevel: prog.level,
          departmentId: department.id
        }
      });
      console.log(`Created Program: ${program.name}`);
    } else {
      console.log(`Found existing Program: ${program.name}`);
    }

    // 3. Create Courses
    let createdCourses = 0;
    for (const courseData of prog.courses) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          code: courseData.code,
          programId: program.id
        }
      });

      if (!existingCourse) {
        await prisma.course.create({
          data: {
            title: courseData.title,
            code: courseData.code,
            creditHours: courseData.creditHours,
            semester: courseData.semester,
            programId: program.id,
            departmentId: department.id,
            courseType: "THEORY",
            session: "2025-2026"
          }
        });
        createdCourses++;
      }
    }
    console.log(`Created ${createdCourses} courses for ${program.name}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
