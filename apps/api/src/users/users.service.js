"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const argon2_1 = require("argon2");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const passwordHash = await (0, argon2_1.hash)(createUserDto.password);
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
    async findAll() {
        const users = await this.prisma.user.findMany();
        return users.map((user) => this.sanitize(user));
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
        return this.sanitize(user);
    }
    async findByIdRaw(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async findByEmailRaw(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async update(id, updateUserDto) {
        const data = {};
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
            data.passwordHash = await (0, argon2_1.hash)(updateUserDto.password);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        return this.sanitize(user);
    }
    async remove(id) {
        const user = await this.prisma.user.delete({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
        return this.sanitize(user);
    }
    sanitizeUser(user) {
        return this.sanitize(user);
    }
    toSessionUser(user) {
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
    sanitize(user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
