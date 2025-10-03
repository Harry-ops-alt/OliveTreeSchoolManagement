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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const argon2_1 = require("argon2");
const users_service_js_1 = require("../users/users.service.js");
let AuthService = class AuthService {
    usersService;
    jwtService;
    jwtTTLSeconds;
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.jwtTTLSeconds = configService.get('JWT_TTL_SECONDS', 900);
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmailRaw(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await (0, argon2_1.verify)(user.passwordHash, password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.usersService.toSessionUser(user);
    }
    async login(email, password) {
        const sessionUser = await this.validateUser(email, password);
        const payload = {
            sub: sessionUser.id,
            ...sessionUser,
        };
        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: this.jwtTTLSeconds,
        });
        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn: this.jwtTTLSeconds,
            user: sessionUser,
        };
    }
    async profile(user) {
        const fullUser = await this.usersService.findByIdRaw(user.id);
        if (!fullUser) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.usersService.toSessionUser(fullUser);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_js_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
