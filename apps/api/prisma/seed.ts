import {
  AdmissionStatus,
  AttendanceSessionStatus,
  AttendanceStatus,
  DayOfWeek,
  FinanceTransactionType,
  PrismaClient,
  StaffAssignmentRole,
} from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "olive-tree-schools" },  // ✅ use a unique ID
    update: {},
    create: {
      id: "olive-tree-schools",           // must match unique field
      name: "Olive Tree Schools",
    },
  });

  const adminPassword = await hash("AdminPass123!");
  const schoolAdminPassword = await hash("SchoolAdmin123!");
  const operationsPassword = await hash("OpsManager123!");
  const branchManagerPassword = await hash("BranchManager123!");
  const admissionsPassword = await hash("Admissions123!");
  const financeManagerPassword = await hash("FinanceManager123!");
  const financeOfficerPassword = await hash("FinanceOfficer123!");
  const teacherPassword = await hash("TeacherPass123!");
  const teachingAssistantPassword = await hash("AssistantPass123!");
  const trainerPassword = await hash("TrainerPass123!");
  const traineePassword = await hash("TraineePass123!");
  const supportStaffPassword = await hash("SupportStaff123!");
  const parentPassword = await hash("ParentGuardian123!");
  const studentPassword = await hash("StudentPass123!");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@olive.school" },
    update: {},
    create: {
      email: "admin@olive.school",
      passwordHash: adminPassword,
      firstName: "Olive",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: "school.admin@olive.school" },
    update: {},
    create: {
      email: "school.admin@olive.school",
      passwordHash: schoolAdminPassword,
      firstName: "School",
      lastName: "Administrator",
      role: "SCHOOL_ADMIN",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const operationsManager = await prisma.user.upsert({
    where: { email: "ops.manager@olive.school" },
    update: {},
    create: {
      email: "ops.manager@olive.school",
      passwordHash: operationsPassword,
      firstName: "Olu",
      lastName: "Operations",
      role: "OPERATIONS_MANAGER",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const admissionsOfficer = await prisma.user.upsert({
    where: { email: "admissions@olive.school" },
    update: {},
    create: {
      email: "admissions@olive.school",
      passwordHash: admissionsPassword,
      firstName: "Ada",
      lastName: "Admissions",
      role: "ADMISSIONS_OFFICER",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: "main-campus" },
    update: {
      name: "Main Campus",
      organizationId: organization.id,
    },
    create: {
      id: "main-campus",
      name: "Main Campus",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const branchManager = await prisma.user.upsert({
    where: { email: "branch.manager@olive.school" },
    update: {
      organizationId: organization.id,
      branchId: branch.id,
    },
    create: {
      email: "branch.manager@olive.school",
      passwordHash: branchManagerPassword,
      firstName: "Bola",
      lastName: "Branch",
      role: "BRANCH_MANAGER",
      organization: {
        connect: { id: organization.id },
      },
      branch: {
        connect: { id: branch.id },
      },
    },
  });

  const financeManager = await prisma.user.upsert({
    where: { email: "finance.manager@olive.school" },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: "finance.manager@olive.school",
      passwordHash: financeManagerPassword,
      firstName: "Femi",
      lastName: "Finance",
      role: "FINANCE_MANAGER",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const financeOfficer = await prisma.user.upsert({
    where: { email: "finance.officer@olive.school" },
    update: {
      organizationId: organization.id,
      branchId: branch.id,
    },
    create: {
      email: "finance.officer@olive.school",
      passwordHash: financeOfficerPassword,
      firstName: "Ngozi",
      lastName: "Finance",
      role: "FINANCE_OFFICER",
      organization: {
        connect: { id: organization.id },
      },
      branch: {
        connect: { id: branch.id },
      },
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@olive.school" },
    update: {
      firstName: "Tayo",
      lastName: "Adeyemi",
      organizationId: organization.id,
      branchId: branch.id,
    },
    create: {
      email: "teacher@olive.school",
      passwordHash: teacherPassword,
      firstName: "Tayo",
      lastName: "Adeyemi",
      role: "TEACHER",
      organization: {
        connect: { id: organization.id },
      },
      branch: {
        connect: { id: branch.id },
      },
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {
      branchId: branch.id,
      subjects: ["Mathematics", "Science"],
    },
    create: {
      userId: teacherUser.id,
      branchId: branch.id,
      subjects: ["Mathematics", "Science"],
    },
  });

  const teachingAssistant = await prisma.user.upsert({
    where: { email: "assistant@olive.school" },
    update: {
      organizationId: organization.id,
      branchId: branch.id,
    },
    create: {
      email: "assistant@olive.school",
      passwordHash: teachingAssistantPassword,
      firstName: "Teni",
      lastName: "Assistant",
      role: "TEACHING_ASSISTANT",
      organization: {
        connect: { id: organization.id },
      },
      branch: {
        connect: { id: branch.id },
      },
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@olive.school" },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: "trainer@olive.school",
      passwordHash: trainerPassword,
      firstName: "Tunde",
      lastName: "Trainer",
      role: "TRAINER",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@olive.school" },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: "trainee@olive.school",
      passwordHash: traineePassword,
      firstName: "Tamara",
      lastName: "Trainee",
      role: "TRAINEE",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const supportStaff = await prisma.user.upsert({
    where: { email: "support@olive.school" },
    update: {
      organizationId: organization.id,
      branchId: branch.id,
    },
    create: {
      email: "support@olive.school",
      passwordHash: supportStaffPassword,
      firstName: "Sola",
      lastName: "Support",
      role: "SUPPORT_STAFF",
      organization: {
        connect: { id: organization.id },
      },
      branch: {
        connect: { id: branch.id },
      },
    },
  });

  const parentGuardian = await prisma.user.upsert({
    where: { email: "parent@olive.school" },
    update: {
      organizationId: organization.id,
    },
    create: {
      email: "parent@olive.school",
      passwordHash: parentPassword,
      firstName: "Patience",
      lastName: "Guardian",
      role: "PARENT_GUARDIAN",
      organization: {
        connect: { id: organization.id },
      },
    },
  });

  const students = [
    {
      email: "amara.bello@student.olive.school",
      firstName: "Amara",
      lastName: "Bello",
      guardianEmail: "amara.mum@example.com",
      admissionId: "admission-amara",
      admissionStatus: AdmissionStatus.PENDING,
      appliedAt: new Date("2025-09-28T08:30:00.000Z"),
      notes: "Awaiting interview with admissions",
    },
    {
      email: "yusuf.daniel@student.olive.school",
      firstName: "Yusuf",
      lastName: "Daniel",
      guardianEmail: "yusuf.guardian@example.com",
      admissionId: "admission-yusuf",
      admissionStatus: AdmissionStatus.APPROVED,
      appliedAt: new Date("2025-08-20T10:15:00.000Z"),
      decidedAt: new Date("2025-09-05T14:45:00.000Z"),
      notes: "Accepted into Year 8",
    },
    {
      email: "tomiwa.ade@student.olive.school",
      firstName: "Tomiwa",
      lastName: "Ade",
      guardianEmail: "tomiwa.parent@example.com",
      admissionId: "admission-tomiwa",
      admissionStatus: AdmissionStatus.REJECTED,
      appliedAt: new Date("2025-08-12T11:00:00.000Z"),
      decidedAt: new Date("2025-09-01T09:30:00.000Z"),
      notes: "Did not meet minimum placement requirements",
    },
  ];

  const studentProfiles: {
    profileId: string;
    email: string;
    status: AdmissionStatus;
  }[] = [];

  for (const student of students) {
    const studentUser = await prisma.user.upsert({
      where: { email: student.email },
      update: {
        firstName: student.firstName,
        lastName: student.lastName,
        organizationId: organization.id,
        branchId: branch.id,
      },
      create: {
        email: student.email,
        passwordHash: studentPassword,
        firstName: student.firstName,
        lastName: student.lastName,
        role: "STUDENT",
        organization: {
          connect: { id: organization.id },
        },
        branch: {
          connect: { id: branch.id },
        },
      },
    });

    const studentProfile = await prisma.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: {
        branchId: branch.id,
        status: student.admissionStatus,
        guardianEmail: student.guardianEmail,
      },
      create: {
        userId: studentUser.id,
        branchId: branch.id,
        guardianEmail: student.guardianEmail,
        status: student.admissionStatus,
      },
    });

    studentProfiles.push({
      profileId: studentProfile.id,
      email: student.email,
      status: student.admissionStatus,
    });

    await prisma.admission.upsert({
      where: { id: student.admissionId },
      update: {
        status: student.admissionStatus,
        branchId: branch.id,
        decidedAt: student.decidedAt ?? null,
        notes: student.notes ?? null,
      },
      create: {
        id: student.admissionId,
        student: {
          connect: { id: studentProfile.id },
        },
        branch: {
          connect: { id: branch.id },
        },
        status: student.admissionStatus,
        appliedAt: student.appliedAt,
        decidedAt: student.decidedAt,
        notes: student.notes ?? null,
      },
    });
  }

  const classroom = await prisma.classroom.upsert({
    where: { id: "main-campus-room-a" },
    update: {
      branchId: branch.id,
      name: "Classroom A",
      capacity: 28,
      location: "Science Block",
      notes: "Equipped with interactive display",
    },
    create: {
      id: "main-campus-room-a",
      branch: {
        connect: { id: branch.id },
      },
      name: "Classroom A",
      capacity: 28,
      location: "Science Block",
      notes: "Equipped with interactive display",
    },
  });

  const classSchedule = await prisma.classSchedule.upsert({
    where: { id: "main-campus-room-a-morning-math" },
    update: {
      branchId: branch.id,
      classroomId: classroom.id,
      teacherProfileId: teacherProfile.id,
      title: "Morning Mathematics",
      description: "Year 8 mathematics with practical lab activities",
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: new Date("2025-10-06T09:00:00.000Z"),
      endTime: new Date("2025-10-06T10:30:00.000Z"),
      isRecurring: true,
    },
    create: {
      id: "main-campus-room-a-morning-math",
      branch: {
        connect: { id: branch.id },
      },
      classroom: {
        connect: { id: classroom.id },
      },
      teacherProfile: {
        connect: { id: teacherProfile.id },
      },
      title: "Morning Mathematics",
      description: "Year 8 mathematics with practical lab activities",
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: new Date("2025-10-06T09:00:00.000Z"),
      endTime: new Date("2025-10-06T10:30:00.000Z"),
      isRecurring: true,
    },
  });

  await prisma.staffAssignment.upsert({
    where: {
      scheduleId_userId: {
        scheduleId: classSchedule.id,
        userId: teacherUser.id,
      },
    },
    update: {
      role: StaffAssignmentRole.LEAD_TEACHER,
    },
    create: {
      schedule: {
        connect: { id: classSchedule.id },
      },
      user: {
        connect: { id: teacherUser.id },
      },
      role: StaffAssignmentRole.LEAD_TEACHER,
    },
  });

  await prisma.staffAssignment.upsert({
    where: {
      scheduleId_userId: {
        scheduleId: classSchedule.id,
        userId: teachingAssistant.id,
      },
    },
    update: {
      role: StaffAssignmentRole.ASSISTANT,
    },
    create: {
      schedule: {
        connect: { id: classSchedule.id },
      },
      user: {
        connect: { id: teachingAssistant.id },
      },
      role: StaffAssignmentRole.ASSISTANT,
    },
  });

  const attendanceSession = await prisma.attendanceSession.upsert({
    where: { id: "attendance-session-2025-10-06-am" },
    update: {
      branchId: branch.id,
      classScheduleId: classSchedule.id,
      date: new Date("2025-10-06T09:00:00.000Z"),
      status: AttendanceSessionStatus.SUBMITTED,
      notes: "First week of term attendance",
      createdById: teacherUser.id,
      submittedAt: new Date("2025-10-06T10:35:00.000Z"),
    },
    create: {
      id: "attendance-session-2025-10-06-am",
      branch: {
        connect: { id: branch.id },
      },
      classSchedule: {
        connect: { id: classSchedule.id },
      },
      date: new Date("2025-10-06T09:00:00.000Z"),
      status: AttendanceSessionStatus.SUBMITTED,
      notes: "First week of term attendance",
      createdBy: {
        connect: { id: teacherUser.id },
      },
      submittedAt: new Date("2025-10-06T10:35:00.000Z"),
    },
  });

  const secondAttendanceSession = await prisma.attendanceSession.upsert({
    where: { id: "attendance-session-2025-10-07-pm" },
    update: {
      branchId: branch.id,
      classScheduleId: classSchedule.id,
      date: new Date("2025-10-07T13:00:00.000Z"),
      status: AttendanceSessionStatus.FINALIZED,
      notes: "Follow-up enrichment class",
      createdById: teacherUser.id,
      submittedAt: new Date("2025-10-07T14:05:00.000Z"),
      finalizedAt: new Date("2025-10-07T14:10:00.000Z"),
    },
    create: {
      id: "attendance-session-2025-10-07-pm",
      branch: {
        connect: { id: branch.id },
      },
      classSchedule: {
        connect: { id: classSchedule.id },
      },
      date: new Date("2025-10-07T13:00:00.000Z"),
      status: AttendanceSessionStatus.FINALIZED,
      notes: "Follow-up enrichment class",
      createdBy: {
        connect: { id: teacherUser.id },
      },
      submittedAt: new Date("2025-10-07T14:05:00.000Z"),
      finalizedAt: new Date("2025-10-07T14:10:00.000Z"),
    },
  });

  const attendanceRecords = [
    {
      studentProfileId: studentProfiles[0]?.profileId,
      status: AttendanceStatus.PRESENT,
      notes: "Arrived on time",
      sessionId: attendanceSession.id,
    },
    {
      studentProfileId: studentProfiles[1]?.profileId,
      status: AttendanceStatus.LATE,
      notes: "Arrived 10 minutes late",
      sessionId: attendanceSession.id,
    },
    {
      studentProfileId: studentProfiles[2]?.profileId,
      status: AttendanceStatus.ABSENT,
      notes: "Awaiting admission decision",
      sessionId: attendanceSession.id,
    },
    {
      studentProfileId: studentProfiles[0]?.profileId,
      status: AttendanceStatus.PRESENT,
      notes: "Participated actively",
      sessionId: secondAttendanceSession.id,
    },
    {
      studentProfileId: studentProfiles[1]?.profileId,
      status: AttendanceStatus.EXCUSED,
      notes: "Approved early departure",
      sessionId: secondAttendanceSession.id,
    },
    {
      studentProfileId: studentProfiles[2]?.profileId,
      status: AttendanceStatus.PRESENT,
      notes: "Orientation session",
      sessionId: secondAttendanceSession.id,
    },
  ].filter((record) => record.studentProfileId && record.sessionId);

  for (const record of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId: record.sessionId!,
          studentId: record.studentProfileId!,
        },
      },
      update: {
        status: record.status,
        notes: record.notes,
        recordedById: teacherUser.id,
        recordedAt: new Date("2025-10-06T09:45:00.000Z"),
      },
      create: {
        session: {
          connect: { id: record.sessionId! },
        },
        student: {
          connect: { id: record.studentProfileId! },
        },
        status: record.status,
        notes: record.notes,
        recordedBy: {
          connect: { id: teacherUser.id },
        },
        recordedAt: new Date("2025-10-06T09:45:00.000Z"),
      },
    });
  }

  const financeTransactions = [
    {
      id: "txn-invoice-oct",
      type: FinanceTransactionType.INVOICE,
      amount: "4500.00",
      occurredAt: new Date("2025-10-01T09:00:00.000Z"),
      reference: "INV-2025-1001",
      description: "October tuition invoices",
    },
    {
      id: "txn-payment-oct",
      type: FinanceTransactionType.PAYMENT,
      amount: "3200.00",
      occurredAt: new Date("2025-10-02T12:30:00.000Z"),
      reference: "PAY-2025-2045",
      description: "Parent tuition payments",
    },
    {
      id: "txn-refund-oct",
      type: FinanceTransactionType.REFUND,
      amount: "150.00",
      occurredAt: new Date("2025-10-03T10:15:00.000Z"),
      reference: "REF-2025-101",
      description: "Refund for cancelled after-school club",
    },
    {
      id: "txn-expense-oct",
      type: FinanceTransactionType.EXPENSE,
      amount: "450.00",
      occurredAt: new Date("2025-09-29T15:45:00.000Z"),
      reference: "EXP-2025-089",
      description: "Science lab equipment",
    },
    {
      id: "txn-payment-scholarship",
      type: FinanceTransactionType.PAYMENT,
      amount: "900.00",
      occurredAt: new Date("2025-10-04T16:20:00.000Z"),
      reference: "PAY-2025-2070",
      description: "Scholarship disbursement",
    },
  ];

  for (const transaction of financeTransactions) {
    await prisma.financeTransaction.upsert({
      where: { id: transaction.id },
      update: {
        type: transaction.type,
        amount: transaction.amount,
        occurredAt: transaction.occurredAt,
        reference: transaction.reference,
        description: transaction.description,
        branchId: branch.id,
      },
      create: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        occurredAt: transaction.occurredAt,
        reference: transaction.reference,
        description: transaction.description,
        branch: {
          connect: { id: branch.id },
        },
      },
    });
  }

  console.log("Seeded organization:", organization.id);
  console.log("Seeded admin user:", adminUser.email);
  console.log("Seeded school admin:", schoolAdmin.email);
  console.log("Seeded operations manager:", operationsManager.email);
  console.log("Seeded admissions officer:", admissionsOfficer.email);
  console.log("Seeded branch manager:", branchManager.email);
  console.log("Seeded finance team:", [financeManager.email, financeOfficer.email]);
  console.log("Seeded branch:", branch.name);
  console.log("Seeded teacher:", teacherUser.email);
  console.log("Seeded teaching assistant:", teachingAssistant.email);
  console.log("Seeded trainer/trainee:", [trainer.email, trainee.email]);
  console.log("Seeded support staff:", supportStaff.email);
  console.log("Seeded parent guardian:", parentGuardian.email);
  console.log("Seeded students:", students.map((student) => student.email));
  console.log("Seeded classroom:", classroom.name);
  console.log("Seeded class schedule:", classSchedule.title);
  console.log("Seeded staff assignments:", [teacherUser.email, teachingAssistant.email]);
  console.log("Seeded attendance sessions:", [attendanceSession.id, secondAttendanceSession.id]);
  console.log(
    "Seeded finance transactions:",
    financeTransactions.map((transaction) => transaction.reference),
  );
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
