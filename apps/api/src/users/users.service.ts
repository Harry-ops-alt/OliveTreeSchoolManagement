import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { hash } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type UserResponse = Omit<User, 'passwordHash'>;

export interface SessionUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  orgId: string | null;
  branchId: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const passwordHash = await hash(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        organizationId: createUserDto.organizationId,
        branchId: createUserDto.branchId,
      },
    });

    return this.sanitize(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.sanitize(user);
  }

  async findByIdRaw(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmailRaw(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const data: Prisma.UserUncheckedUpdateInput = {};

    if (typeof updateUserDto.email !== 'undefined') {
      data.email = updateUserDto.email;
    }
    if (typeof updateUserDto.firstName !== 'undefined') {
      data.firstName = updateUserDto.firstName;
    }
    if (typeof updateUserDto.lastName !== 'undefined') {
      data.lastName = updateUserDto.lastName;
    }
    if (typeof updateUserDto.role !== 'undefined') {
      data.role = updateUserDto.role;
    }
    if (typeof updateUserDto.organizationId !== 'undefined') {
      data.organizationId = updateUserDto.organizationId ?? null;
    }
    if (typeof updateUserDto.branchId !== 'undefined') {
      data.branchId = updateUserDto.branchId ?? null;
    }
    if (updateUserDto.password) {
      data.passwordHash = await hash(updateUserDto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.sanitize(user);
  }

  async remove(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.delete({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.sanitize(user);
  }

  sanitizeUser(user: User): UserResponse {
    return this.sanitize(user);
  }

  toSessionUser(user: User): SessionUserData {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      orgId: user.organizationId ?? null,
      branchId: user.branchId ?? null,
    };
  }

  private sanitize(user: User): UserResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
