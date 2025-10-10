import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AdmissionContactChannel,
  AdmissionLeadStage,
  Role,
} from '@prisma/client';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { REQUEST_USER_KEY } from '../src/auth/auth.constants';
import type { SessionUserData } from '../src/users/users.service';
import cookieParser from 'cookie-parser';

describe('AdmissionsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let currentUser: SessionUserData;
  let organizationId: string;
  let primaryBranchId: string;
  let secondaryBranchId: string;
  let existingLeadId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'test-secret';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    process.env.NODE_ENV ??= 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request[REQUEST_USER_KEY] = currentUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request[REQUEST_USER_KEY] = currentUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.enableCors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    });

    await app.init();

    prisma = moduleFixture.get(PrismaService);
    server = app.getHttpServer();

  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.admissionLeadStageHistory.deleteMany({});
    await prisma.admissionLeadContact.deleteMany({});
    await prisma.admissionLead.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    organizationId = randomUUID();
    const userId = randomUUID();

    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Test Organization',
      },
    });

    const primaryBranch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        name: 'Primary Campus',
        organizationId,
      },
    });
    primaryBranchId = primaryBranch.id;

    const secondaryBranch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        name: 'Secondary Campus',
        organizationId,
      },
    });
    secondaryBranchId = secondaryBranch.id;

    await prisma.user.create({
      data: {
        id: userId,
        email: 'super.admin@test.local',
        passwordHash: 'hashed',
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        organizationId,
      },
    });

    currentUser = {
      id: userId,
      email: 'super.admin@test.local',
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      orgId: organizationId,
      branchId: null,
    };

    const lead = await prisma.admissionLead.create({
      data: {
        id: randomUUID(),
        branchId: primaryBranchId,
        parentFirstName: 'Initial',
        parentLastName: 'Lead',
        parentEmail: 'initial.parent@example.com',
        stage: AdmissionLeadStage.NEW,
      },
    });

    existingLeadId = lead.id;
  });

  describe('POST /admissions/leads', () => {
    it('creates a new lead and normalises fields', async () => {
      const payload = {
        branchId: primaryBranchId,
        parentFirstName: '  Ada  ',
        parentLastName: '  Lovelace  ',
        parentEmail: 'Ada.LOVELACE@Example.COM',
        parentPhone: ' +44 7000 000000 ',
        studentFirstName: '  Byron  ',
        studentLastName: '  Junior  ',
        programmeInterest: ' STEM ',
        tags: [' gifted ', ' stem '],
      };

      const response = await request(server).post('/admissions/leads').send(payload);

      if (response.status !== 201) {
        // eslint-disable-next-line no-console
        console.log('createLead response', response.status, response.body, response.text);
      }
      expect(response.status).toBe(201);
      expect(response.body.parentFirstName).toBe('Ada');
      expect(response.body.parentLastName).toBe('Lovelace');
      expect(response.body.parentEmail).toBe('ada.lovelace@example.com');

      const leadInDb = await prisma.admissionLead.findUnique({
        where: { id: response.body.id },
      });

      expect(leadInDb).not.toBeNull();
      expect(leadInDb?.parentFirstName).toBe('Ada');
      expect(leadInDb?.parentLastName).toBe('Lovelace');
      expect(leadInDb?.parentEmail).toBe('ada.lovelace@example.com');

      const stageHistoryCount = await prisma.admissionLeadStageHistory.count({
        where: { leadId: response.body.id },
      });
      expect(stageHistoryCount).toBe(1);
    });
  });

  describe('PATCH /admissions/leads/:id', () => {
    it('updates lead details and branch assignment', async () => {
      const payload = {
        branchId: secondaryBranchId,
        parentFirstName: '  Grace  ',
        parentLastName: ' Hopper ',
        parentEmail: 'Grace.Hopper@Example.com',
        parentPhone: '  +44 8000 000000  ',
        studentFirstName: '  Student  ',
        studentLastName: ' Example ',
      };

      const response = await request(server)
        .patch(`/admissions/leads/${existingLeadId}`)
        .send(payload);

      if (response.status !== 200) {
        // eslint-disable-next-line no-console
        console.log('updateLead response', response.status, response.body, response.text);
      }
      expect(response.status).toBe(200);
      expect(response.body.parentFirstName).toBe('Grace');
      expect(response.body.parentLastName).toBe('Hopper');
      expect(response.body.parentEmail).toBe('grace.hopper@example.com');
      expect(response.body.branch?.id).toBe(secondaryBranchId);

      const leadInDb = await prisma.admissionLead.findUnique({
        where: { id: existingLeadId },
      });

      expect(leadInDb?.branchId).toBe(secondaryBranchId);
      expect(leadInDb?.parentFirstName).toBe('Grace');
      expect(leadInDb?.studentFirstName).toBe('Student');
    });
  });

  describe('POST /admissions/leads/:id/stage', () => {
    it('transitions a lead to a new stage and records history', async () => {
      const payload = {
        toStage: AdmissionLeadStage.CONTACTED,
        reason: 'Called parent to discuss next steps',
      };

      const response = await request(server)
        .post(`/admissions/leads/${existingLeadId}/stage`)
        .send(payload);

      if (response.status !== 201) {
        // eslint-disable-next-line no-console
        console.log('updateStage response', response.status, response.body, response.text);
      }
      expect(response.status).toBe(201);
      expect(response.body.stage).toBe(AdmissionLeadStage.CONTACTED);

      const leadInDb = await prisma.admissionLead.findUnique({
        where: { id: existingLeadId },
      });
      expect(leadInDb?.stage).toBe(AdmissionLeadStage.CONTACTED);

      const history = await prisma.admissionLeadStageHistory.findMany({
        where: { leadId: existingLeadId },
      });

      expect(history).toHaveLength(1);
      expect(history[0].toStage).toBe(AdmissionLeadStage.CONTACTED);
      expect(history[0].reason).toBe('Called parent to discuss next steps');
    });
  });

  describe('POST /admissions/leads/:id/contacts', () => {
    it('records a lead contact with trimmed summary', async () => {
      const payload = {
        channel: AdmissionContactChannel.CALL,
        summary: '  Spoke with parent about documents  ',
      };

      const response = await request(server)
        .post(`/admissions/leads/${existingLeadId}/contacts`)
        .send(payload);

      if (response.status !== 201) {
        // eslint-disable-next-line no-console
        console.log('recordContact response', response.status, response.body, response.text);
      }
      expect(response.status).toBe(201);
      expect(response.body.contacts[0].summary).toBe('Spoke with parent about documents');
      expect(response.body.contacts[0].channel).toBe(AdmissionContactChannel.CALL);

      const contact = await prisma.admissionLeadContact.findFirst({
        where: { leadId: existingLeadId },
      });

      expect(contact).not.toBeNull();
      expect(contact?.summary).toBe('Spoke with parent about documents');
      expect(contact?.channel).toBe(AdmissionContactChannel.CALL);
    });
  });
});
