import {
  AdmissionApplicationStatus,
  AdmissionContactChannel,
  AdmissionDecision,
  AdmissionLeadStage,
  AdmissionStatus,
  AdmissionTaskStatus,
  AttendanceSessionStatus,
  AttendanceStatus,
  DayOfWeek,
  FinanceTransactionType,
  Gender,
  PrismaClient,
  StaffAssignmentRole,
  StudentStatus,
} from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

type SeedGuardian = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  relationship?: string;
  isPrimary?: boolean;
  contactOrder?: number;
  branchId?: string;
};

type SeedStudent = {
  email: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  studentStatus: StudentStatus;
  gender?: Gender;
  gradeLevel?: string;
  homeroom?: string;
  enrollmentDate?: Date;
  primaryLanguage?: string;
  phone?: string;
  alternatePhone?: string;
  additionalSupportNotes?: string;
  medicalNotes?: string;
  dateOfBirth?: Date;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string;
  guardians: SeedGuardian[];
  admission: {
    id: string;
    status: AdmissionStatus;
    appliedAt: Date;
    decidedAt?: Date | null;
    notes?: string | null;
  };
};

type AdmissionLeadStageEventSeed = {
  id: string;
  fromStage?: AdmissionLeadStage;
  toStage: AdmissionLeadStage;
  changedAt: Date;
  reason?: string;
};

type AdmissionLeadContactSeed = {
  id: string;
  channel: AdmissionContactChannel;
  summary: string;
  occurredAt: Date;
};

type AdmissionLeadTaskSeed = {
  id: string;
  title: string;
  description?: string;
  dueAt?: Date;
  status: AdmissionTaskStatus;
  assigneeId?: string;
};

type AdmissionLeadApplicationSeed = {
  id: string;
  yearGroup?: string;
  requestedStart?: Date;
  status: AdmissionApplicationStatus;
  submittedAt?: Date;
  decision?: AdmissionDecision;
  decisionNotes?: string;
  decisionAt?: Date;
};

type AdmissionLeadOfferSeed = {
  id: string;
  templateKey: string;
  issuedAt?: Date;
  expiresAt?: Date;
  signedAt?: Date;
};

type AdmissionLeadSeed = {
  id: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  studentFirstName?: string;
  studentLastName?: string;
  programmeInterest?: string;
  preferredContactAt?: Date;
  source?: string;
  notes?: string;
  tags: string[];
  stage: AdmissionLeadStage;
  stageEvents?: AdmissionLeadStageEventSeed[];
  contacts?: AdmissionLeadContactSeed[];
  tasks?: AdmissionLeadTaskSeed[];
  application?: AdmissionLeadApplicationSeed;
  offer?: AdmissionLeadOfferSeed;
};

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

  const students: SeedStudent[] = [
    {
      email: "amara.bello@student.olive.school",
      firstName: "Amara",
      lastName: "Bello",
      studentNumber: "STU-2025-001",
      studentStatus: StudentStatus.APPLIED,
      gender: Gender.FEMALE,
      gradeLevel: "Year 8",
      homeroom: "Emerald 8A",
      enrollmentDate: new Date("2025-09-01T08:00:00.000Z"),
      primaryLanguage: "English",
      dateOfBirth: new Date("2012-04-15T00:00:00.000Z"),
      address: {
        line1: "12 Akintola Street",
        city: "Lagos",
        state: "Lagos",
        postalCode: "100001",
        country: "NG",
      },
      guardians: [
        {
          id: "guardian-amara-bello",
          firstName: "Ngozi",
          lastName: "Bello",
          email: "amara.mum@example.com",
          phone: "+2347010000001",
          alternatePhone: "+2348090000001",
          addressLine1: "12 Akintola Street",
          city: "Lagos",
          state: "Lagos",
          postalCode: "100001",
          country: "NG",
          relationship: "Mother",
          isPrimary: true,
          contactOrder: 1,
        },
      ],
      admission: {
        id: "admission-amara",
        status: AdmissionStatus.PENDING,
        appliedAt: new Date("2025-09-28T08:30:00.000Z"),
        decidedAt: null,
        notes: "Awaiting interview with admissions",
      },
    },
    {
      email: "yusuf.daniel@student.olive.school",
      firstName: "Yusuf",
      lastName: "Daniel",
      studentNumber: "STU-2025-002",
      studentStatus: StudentStatus.ENROLLED,
      gender: Gender.MALE,
      gradeLevel: "Year 8",
      homeroom: "Emerald 8B",
      enrollmentDate: new Date("2025-08-25T08:00:00.000Z"),
      primaryLanguage: "English",
      phone: "+2347010000002",
      alternatePhone: "+2348090000002",
      dateOfBirth: new Date("2011-11-02T00:00:00.000Z"),
      address: {
        line1: "7 Unity Close",
        city: "Abuja",
        state: "FCT",
        postalCode: "900211",
        country: "NG",
      },
      guardians: [
        {
          id: "guardian-yusuf-daniel",
          firstName: "Hajara",
          lastName: "Daniel",
          email: "yusuf.guardian@example.com",
          phone: "+2347010000003",
          addressLine1: "7 Unity Close",
          city: "Abuja",
          state: "FCT",
          postalCode: "900211",
          country: "NG",
          relationship: "Mother",
          isPrimary: true,
          contactOrder: 1,
        },
        {
          id: "guardian-yusuf-daniel-father",
          firstName: "Ibrahim",
          lastName: "Daniel",
          email: "yusuf.father@example.com",
          phone: "+2347010000004",
          addressLine1: "7 Unity Close",
          city: "Abuja",
          state: "FCT",
          postalCode: "900211",
          country: "NG",
          relationship: "Father",
          isPrimary: false,
          contactOrder: 2,
        },
      ],
      admission: {
        id: "admission-yusuf",
        status: AdmissionStatus.APPROVED,
        appliedAt: new Date("2025-08-20T10:15:00.000Z"),
        decidedAt: new Date("2025-09-05T14:45:00.000Z"),
        notes: "Accepted into Year 8",
      },
    },
    {
      email: "tomiwa.ade@student.olive.school",
      firstName: "Tomiwa",
      lastName: "Ade",
      studentNumber: "STU-2025-003",
      studentStatus: StudentStatus.WITHDRAWN,
      gender: Gender.NON_BINARY,
      gradeLevel: "Year 7",
      homeroom: "Cedar 7C",
      primaryLanguage: "English",
      dateOfBirth: new Date("2013-02-22T00:00:00.000Z"),
      notes: "Transferred from another branch",
      address: {
        line1: "18 Palm Grove",
        city: "Ibadan",
        state: "Oyo",
        postalCode: "200221",
        country: "NG",
      },
      guardians: [
        {
          id: "guardian-tomiwa-ade",
          firstName: "Kunle",
          lastName: "Ade",
          email: "tomiwa.parent@example.com",
          phone: "+2347010000005",
          addressLine1: "18 Palm Grove",
          city: "Ibadan",
          state: "Oyo",
          postalCode: "200221",
          country: "NG",
          relationship: "Father",
          isPrimary: true,
          contactOrder: 1,
        },
      ],
      admission: {
        id: "admission-tomiwa",
        status: AdmissionStatus.REJECTED,
        appliedAt: new Date("2025-08-12T11:00:00.000Z"),
        decidedAt: new Date("2025-09-01T09:30:00.000Z"),
        notes: "Did not meet minimum placement requirements",
      },
    },
  ];

  const studentProfiles: {
    profileId: string;
    email: string;
    status: StudentStatus;
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
        studentNumber: student.studentNumber,
        email: student.email,
        phone: student.phone ?? null,
        alternatePhone: student.alternatePhone ?? null,
        status: student.studentStatus,
        gradeLevel: student.gradeLevel ?? null,
        homeroom: student.homeroom ?? null,
        primaryLanguage: student.primaryLanguage ?? null,
        additionalSupportNotes: student.additionalSupportNotes ?? null,
        medicalNotes: student.medicalNotes ?? null,
        gender: student.gender ?? null,
        dateOfBirth: student.dateOfBirth ?? null,
        addressLine1: student.address?.line1 ?? null,
        addressLine2: student.address?.line2 ?? null,
        city: student.address?.city ?? null,
        state: student.address?.state ?? null,
        postalCode: student.address?.postalCode ?? null,
        country: student.address?.country ?? null,
        notes: student.notes ?? null,
      },
      create: {
        userId: studentUser.id,
        branchId: branch.id,
        studentNumber: student.studentNumber,
        email: student.email,
        phone: student.phone ?? null,
        alternatePhone: student.alternatePhone ?? null,
        enrollmentDate: student.enrollmentDate ?? new Date(),
        status: student.studentStatus,
        gradeLevel: student.gradeLevel ?? null,
        homeroom: student.homeroom ?? null,
        primaryLanguage: student.primaryLanguage ?? null,
        additionalSupportNotes: student.additionalSupportNotes ?? null,
        medicalNotes: student.medicalNotes ?? null,
        gender: student.gender ?? null,
        dateOfBirth: student.dateOfBirth ?? null,
        addressLine1: student.address?.line1 ?? null,
        addressLine2: student.address?.line2 ?? null,
        city: student.address?.city ?? null,
        state: student.address?.state ?? null,
        postalCode: student.address?.postalCode ?? null,
        country: student.address?.country ?? null,
        notes: student.notes ?? null,
      },
    });

    for (const [index, guardianData] of student.guardians.entries()) {
      const guardian = await prisma.guardian.upsert({
        where: { id: guardianData.id },
        update: {
          firstName: guardianData.firstName,
          lastName: guardianData.lastName,
          email: guardianData.email ?? null,
          phone: guardianData.phone ?? null,
          alternatePhone: guardianData.alternatePhone ?? null,
          addressLine1: guardianData.addressLine1 ?? null,
          addressLine2: guardianData.addressLine2 ?? null,
          city: guardianData.city ?? null,
          state: guardianData.state ?? null,
          postalCode: guardianData.postalCode ?? null,
          country: guardianData.country ?? null,
          notes: guardianData.notes ?? null,
          branchId: guardianData.branchId ?? branch.id,
        },
        create: {
          id: guardianData.id,
          organizationId: organization.id,
          branchId: guardianData.branchId ?? branch.id,
          firstName: guardianData.firstName,
          lastName: guardianData.lastName,
          email: guardianData.email ?? null,
          phone: guardianData.phone ?? null,
          alternatePhone: guardianData.alternatePhone ?? null,
          addressLine1: guardianData.addressLine1 ?? null,
          addressLine2: guardianData.addressLine2 ?? null,
          city: guardianData.city ?? null,
          state: guardianData.state ?? null,
          postalCode: guardianData.postalCode ?? null,
          country: guardianData.country ?? null,
          notes: guardianData.notes ?? null,
        },
      });

      await prisma.studentGuardian.upsert({
        where: { id: `${studentProfile.id}-${guardian.id}` },
        update: {
          relationship: guardianData.relationship ?? null,
          isPrimary: guardianData.isPrimary ?? false,
          contactOrder: guardianData.contactOrder ?? index + 1,
        },
        create: {
          id: `${studentProfile.id}-${guardian.id}`,
          student: {
            connect: { id: studentProfile.id },
          },
          guardian: {
            connect: { id: guardian.id },
          },
          relationship: guardianData.relationship ?? null,
          isPrimary: guardianData.isPrimary ?? false,
          contactOrder: guardianData.contactOrder ?? index + 1,
        },
      });
    }

    studentProfiles.push({
      profileId: studentProfile.id,
      email: student.email,
      status: student.studentStatus,
    });

    await prisma.admission.upsert({
      where: { id: student.admission.id },
      update: {
        status: student.admission.status,
        branchId: branch.id,
        decidedAt: student.admission.decidedAt ?? null,
        notes: student.admission.notes ?? null,
      },
      create: {
        id: student.admission.id,
        student: {
          connect: { id: studentProfile.id },
        },
        branch: {
          connect: { id: branch.id },
        },
        status: student.admission.status,
        appliedAt: student.admission.appliedAt,
        decidedAt: student.admission.decidedAt ?? null,
        notes: student.admission.notes ?? null,
      },
    });
  }

  const classroom = await prisma.classroom.upsert({
    where: { id: "main-campus-room-a" },
    update: {
      branchId: branch.id,
      name: "Classroom A",
      capacity: 28,
    },
    create: {
      id: "main-campus-room-a",
      branch: {
        connect: { id: branch.id },
      },
      name: "Classroom A",
      capacity: 28,
    },
  });

  // Seed Classes (cohorts)
  const classYear6A = await prisma.class.upsert({
    where: { id: "class-year-6-a" },
    update: {
      branchId: branch.id,
      classroomId: classroom.id,
      name: "Year 6 A",
      code: "Y6A",
      capacity: 25,
      yearGroup: "Year 6",
      active: true,
    },
    create: {
      id: "class-year-6-a",
      branch: {
        connect: { id: branch.id },
      },
      classroom: {
        connect: { id: classroom.id },
      },
      name: "Year 6 A",
      code: "Y6A",
      capacity: 25,
      yearGroup: "Year 6",
      active: true,
    },
  });

  const classYear7B = await prisma.class.upsert({
    where: { id: "class-year-7-b" },
    update: {
      branchId: branch.id,
      classroomId: null,
      name: "Year 7 B",
      code: "Y7B",
      capacity: 30,
      yearGroup: "Year 7",
      active: true,
    },
    create: {
      id: "class-year-7-b",
      branch: {
        connect: { id: branch.id },
      },
      name: "Year 7 B",
      code: "Y7B",
      capacity: 30,
      yearGroup: "Year 7",
      active: true,
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

  const admissionLeadSeeds: AdmissionLeadSeed[] = [
    {
      id: "lead-chioma-okafor",
      parentFirstName: "Chioma",
      parentLastName: "Okafor",
      parentEmail: "chioma.okafor@example.com",
      parentPhone: "+2347010001111",
      studentFirstName: "Ada",
      studentLastName: "Okafor",
      programmeInterest: "Year 7 STEM",
      preferredContactAt: new Date("2025-10-07T10:30:00.000Z"),
      source: "Open Day",
      notes: "Family is asking about scholarship opportunities and boarding.",
      tags: ["Priority", "Scholarship"],
      stage: AdmissionLeadStage.CONTACTED,
      stageEvents: [
        {
          id: "lead-chioma-okafor-stage-contacted",
          fromStage: AdmissionLeadStage.NEW,
          toStage: AdmissionLeadStage.CONTACTED,
          changedAt: new Date("2025-10-05T09:45:00.000Z"),
          reason: "Parent confirmed interest after open day follow-up.",
        },
      ],
      contacts: [
        {
          id: "lead-chioma-okafor-contact-initial",
          channel: AdmissionContactChannel.CALL,
          summary: "Initial call with parent to explain admissions timeline and scholarship options.",
          occurredAt: new Date("2025-10-05T09:30:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "lead-chioma-okafor-task-pack",
          title: "Send scholarship information pack",
          description: "Email scholarship application requirements and deadlines to the family.",
          dueAt: new Date("2025-10-08T17:00:00.000Z"),
          status: AdmissionTaskStatus.IN_PROGRESS,
          assigneeId: admissionsOfficer.id,
        },
      ],
    },
    {
      id: "lead-samuel-adegbite",
      parentFirstName: "Samuel",
      parentLastName: "Adegbite",
      parentEmail: "samuel.adegbite@example.com",
      parentPhone: "+2348025558899",
      studentFirstName: "Ife",
      studentLastName: "Adegbite",
      programmeInterest: "Creative Arts Programme",
      preferredContactAt: new Date("2025-10-09T14:00:00.000Z"),
      source: "Website Enquiry",
      notes: "Student is musically gifted; interested in taster session availability.",
      tags: ["Music", "Taster"],
      stage: AdmissionLeadStage.TASTER_BOOKED,
      stageEvents: [
        {
          id: "lead-samuel-adegbite-stage-contacted",
          fromStage: AdmissionLeadStage.NEW,
          toStage: AdmissionLeadStage.CONTACTED,
          changedAt: new Date("2025-10-03T11:20:00.000Z"),
          reason: "Responded to website enquiry and shared programme overview.",
        },
        {
          id: "lead-samuel-adegbite-stage-taster",
          fromStage: AdmissionLeadStage.CONTACTED,
          toStage: AdmissionLeadStage.TASTER_BOOKED,
          changedAt: new Date("2025-10-04T10:05:00.000Z"),
          reason: "Parent confirmed attendance at creative arts taster session.",
        },
      ],
      contacts: [
        {
          id: "lead-samuel-adegbite-contact-email",
          channel: AdmissionContactChannel.EMAIL,
          summary: "Sent calendar invite and checklist for upcoming creative arts taster.",
          occurredAt: new Date("2025-10-04T10:10:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "lead-samuel-adegbite-task-confirm",
          title: "Confirm taster session attendance",
          description: "Call the family the day before to reconfirm arrival time and materials.",
          dueAt: new Date("2025-10-09T09:00:00.000Z"),
          status: AdmissionTaskStatus.PENDING,
          assigneeId: branchManager.id,
        },
      ],
    },
    {
      id: "lead-lara-balogun",
      parentFirstName: "Lara",
      parentLastName: "Balogun",
      parentEmail: "lara.balogun@example.com",
      parentPhone: "+2348091112233",
      studentFirstName: "Seyi",
      studentLastName: "Balogun",
      programmeInterest: "Year 9 Boarding",
      preferredContactAt: new Date("2025-10-02T16:00:00.000Z"),
      source: "Agent Referral",
      notes: "High priority applicant referred by partnering agency.",
      tags: ["Agent", "High Priority"],
      stage: AdmissionLeadStage.OFFER,
      stageEvents: [
        {
          id: "lead-lara-balogun-stage-contacted",
          fromStage: AdmissionLeadStage.NEW,
          toStage: AdmissionLeadStage.CONTACTED,
          changedAt: new Date("2025-09-28T15:20:00.000Z"),
          reason: "Agent introduction call and requirement review.",
        },
        {
          id: "lead-lara-balogun-stage-offer",
          fromStage: AdmissionLeadStage.TASTER_BOOKED,
          toStage: AdmissionLeadStage.OFFER,
          changedAt: new Date("2025-10-03T18:40:00.000Z"),
          reason: "Admissions committee approved conditional offer.",
        },
      ],
      contacts: [
        {
          id: "lead-lara-balogun-contact-agent",
          channel: AdmissionContactChannel.NOTE,
          summary: "Agent provided updated academic transcripts and recommendation letters.",
          occurredAt: new Date("2025-10-01T13:15:00.000Z"),
        },
      ],
      tasks: [
        {
          id: "lead-lara-balogun-task-offer",
          title: "Follow up on offer acceptance",
          description: "Call Lara to walk through acceptance paperwork and deposit timeline.",
          dueAt: new Date("2025-10-10T12:00:00.000Z"),
          status: AdmissionTaskStatus.IN_PROGRESS,
          assigneeId: admissionsOfficer.id,
        },
      ],
      application: {
        id: "application-lara-balogun",
        yearGroup: "Year 9",
        requestedStart: new Date("2026-01-10T08:00:00.000Z"),
        status: AdmissionApplicationStatus.UNDER_REVIEW,
        submittedAt: new Date("2025-09-30T12:00:00.000Z"),
        decision: AdmissionDecision.OFFERED,
        decisionNotes: "Offer issued pending deposit payment.",
        decisionAt: new Date("2025-10-03T18:30:00.000Z"),
      },
      offer: {
        id: "offer-lara-balogun",
        templateKey: "2025-offer-standard",
        issuedAt: new Date("2025-10-03T18:35:00.000Z"),
        expiresAt: new Date("2025-10-17T18:35:00.000Z"),
      },
    },
  ];

  for (const seed of admissionLeadSeeds) {
    const leadRecord = await prisma.admissionLead.upsert({
      where: { id: seed.id },
      update: {
        branchId: branch.id,
        assignedStaffId: admissionsOfficer.id,
        parentFirstName: seed.parentFirstName,
        parentLastName: seed.parentLastName,
        parentEmail: seed.parentEmail,
        parentPhone: seed.parentPhone ?? null,
        studentFirstName: seed.studentFirstName ?? null,
        studentLastName: seed.studentLastName ?? null,
        programmeInterest: seed.programmeInterest ?? null,
        preferredContactAt: seed.preferredContactAt ?? null,
        source: seed.source ?? null,
        notes: seed.notes ?? null,
        tags: seed.tags,
        stage: seed.stage,
      },
      create: {
        id: seed.id,
        branchId: branch.id,
        assignedStaffId: admissionsOfficer.id,
        parentFirstName: seed.parentFirstName,
        parentLastName: seed.parentLastName,
        parentEmail: seed.parentEmail,
        parentPhone: seed.parentPhone ?? null,
        studentFirstName: seed.studentFirstName ?? null,
        studentLastName: seed.studentLastName ?? null,
        programmeInterest: seed.programmeInterest ?? null,
        preferredContactAt: seed.preferredContactAt ?? null,
        source: seed.source ?? null,
        notes: seed.notes ?? null,
        tags: seed.tags,
        stage: seed.stage,
      },
    });

    for (const event of seed.stageEvents ?? []) {
      await prisma.admissionLeadStageHistory.upsert({
        where: { id: event.id },
        update: {
          fromStage: event.fromStage ?? null,
          toStage: event.toStage,
          changedAt: event.changedAt,
          changedById: admissionsOfficer.id,
          reason: event.reason ?? null,
        },
        create: {
          id: event.id,
          leadId: leadRecord.id,
          fromStage: event.fromStage ?? null,
          toStage: event.toStage,
          changedAt: event.changedAt,
          changedById: admissionsOfficer.id,
          reason: event.reason ?? null,
        },
      });
    }

    for (const contact of seed.contacts ?? []) {
      await prisma.admissionLeadContact.upsert({
        where: { id: contact.id },
        update: {
          leadId: leadRecord.id,
          userId: admissionsOfficer.id,
          channel: contact.channel,
          summary: contact.summary,
          occurredAt: contact.occurredAt,
        },
        create: {
          id: contact.id,
          leadId: leadRecord.id,
          userId: admissionsOfficer.id,
          channel: contact.channel,
          summary: contact.summary,
          occurredAt: contact.occurredAt,
        },
      });
    }

    for (const task of seed.tasks ?? []) {
      await prisma.admissionTask.upsert({
        where: { id: task.id },
        update: {
          leadId: leadRecord.id,
          title: task.title,
          description: task.description ?? null,
          dueAt: task.dueAt ?? null,
          status: task.status,
          assigneeId: task.assigneeId ?? null,
          createdById: admissionsOfficer.id,
        },
        create: {
          id: task.id,
          leadId: leadRecord.id,
          title: task.title,
          description: task.description ?? null,
          dueAt: task.dueAt ?? null,
          status: task.status,
          assigneeId: task.assigneeId ?? null,
          createdById: admissionsOfficer.id,
        },
      });
    }

    if (seed.application) {
      await prisma.admissionApplication.upsert({
        where: { id: seed.application.id },
        update: {
          leadId: leadRecord.id,
          branchId: branch.id,
          yearGroup: seed.application.yearGroup ?? null,
          requestedStart: seed.application.requestedStart ?? null,
          status: seed.application.status,
          submittedAt: seed.application.submittedAt ?? null,
          reviewedById: admissionsOfficer.id,
          decision: seed.application.decision ?? null,
          decisionNotes: seed.application.decisionNotes ?? null,
          decisionAt: seed.application.decisionAt ?? null,
        },
        create: {
          id: seed.application.id,
          leadId: leadRecord.id,
          branchId: branch.id,
          yearGroup: seed.application.yearGroup ?? null,
          requestedStart: seed.application.requestedStart ?? null,
          status: seed.application.status,
          submittedAt: seed.application.submittedAt ?? null,
          reviewedById: admissionsOfficer.id,
          decision: seed.application.decision ?? null,
          decisionNotes: seed.application.decisionNotes ?? null,
          decisionAt: seed.application.decisionAt ?? null,
        },
      });

      if (seed.offer) {
        await prisma.admissionOfferLetter.upsert({
          where: { id: seed.offer.id },
          update: {
            applicationId: seed.application.id,
            templateKey: seed.offer.templateKey,
            issuedAt: seed.offer.issuedAt ?? new Date(),
            expiresAt: seed.offer.expiresAt ?? null,
            signedAt: seed.offer.signedAt ?? null,
          },
          create: {
            id: seed.offer.id,
            applicationId: seed.application.id,
            templateKey: seed.offer.templateKey,
            issuedAt: seed.offer.issuedAt ?? new Date(),
            expiresAt: seed.offer.expiresAt ?? null,
            signedAt: seed.offer.signedAt ?? null,
          },
        });
      }
    }
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
  console.log("Seeded classes:", [classYear6A.name, classYear7B.name]);
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
