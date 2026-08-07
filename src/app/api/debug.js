const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const studentName = 'naved';
    const fatherName = 'hhghg';
    const cnic = '656565654545454';
    const dateOfBirth = '1995-01-12';
    const contactNumber = '03033326565';
    const email = '';
    const residentAddress = 'Quetta';
    const customFields = null;
    const educationLevel = 'BS';
    const programId = 'a4089b7f-b658-44e6-8564-edf48625f32d'; // from log
    const groupId = null;
    const bsAdmissionType = 'REGULAR';
    const migrationSemester = null;
    const session = '2026-2030';
    const gender = 'MALE';
    
    // Simulate transaction
    const result = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          studentName,
          fatherName,
          cnic: cnic || null,
          dateOfBirth: new Date(dateOfBirth),
          contactNumber,
          email: email || null,
          residentAddress: residentAddress || null,
          customFields: customFields || null,
          educationLevel,
          programId: programId || null,
          groupId: groupId || null,
          bsAdmissionType: bsAdmissionType || null,
          migrationSemester: null,
          session: session || null,
          gender: gender || null,
        },
      });

      console.log('Created admission:', admission.id);

      // Get sequence settings for Challan number
      let sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      if (!sequenceSetting) {
        await tx.systemSetting.create({ data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" } });
        sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
      }
      const currentSequence = Number(sequenceSetting?.value || "135622565");
      await tx.systemSetting.update({
        where: { key: "CHALLAN_SEQUENCE_CURRENT" },
        data: { value: String(currentSequence + 1) },
      });

      const feeKey = admission.educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION";
      let feeSetting = null;
      const admissionSessionNum = Number(admission.session);
      if (admissionSessionNum) {
        const overrides = await tx.feeSettings.findMany({
          where: { key: feeKey, session: { not: null } }
        });
        const validOverrides = overrides
          .filter(o => o.session && !isNaN(Number(o.session)) && Number(o.session) <= admissionSessionNum)
          .sort((a, b) => Number(b.session) - Number(a.session));
        if (validOverrides.length > 0) {
          feeSetting = validOverrides[0];
        }
      }
      if (!feeSetting) {
        feeSetting = await tx.feeSettings.findFirst({
          where: { key: feeKey, OR: [{ session: null }, { session: "" }] }
        });
      }
      const feeAmount = feeSetting?.amount ?? (admission.educationLevel === "BS" ? 8500 : 5000);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const challan = await tx.challan.create({
        data: {
          challanNumber: String(currentSequence),
          cnic: admission.cnic || "N/A",
          applicantName: admission.studentName,
          fatherName: admission.fatherName,
          feeType: feeKey,
          feeLabel: feeSetting?.label || "Admission Fee",
          amount: feeAmount,
          dueDate,
          educationLevel: admission.educationLevel,
          semester: 1,
          session: admission.session,
          gender: admission.gender,
          programId: admission.programId,
          admissionId: admission.id,
        }
      });
      console.log('Created challan:', challan.challanNumber);
      return { admission, challan };
    });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error in transaction:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
