import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, PrismaService],
    }).compile();

    appController = app.get<AppController>(AppController);
    prismaService = app.get<PrismaService>(PrismaService);

    jest.spyOn(prismaService.user, 'count').mockResolvedValue(0);
  });

  describe('root', () => {
    it('should return status string', async () => {
      await expect(appController.getHello()).resolves.toMatch(/API is running/);
    });
  });
});
