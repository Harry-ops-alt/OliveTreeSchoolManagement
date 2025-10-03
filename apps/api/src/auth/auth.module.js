"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const users_module_js_1 = require("../users/users.module.js");
const auth_service_js_1 = require("./auth.service.js");
const auth_controller_js_1 = require("./auth.controller.js");
const jwt_strategy_js_1 = require("./strategies/jwt.strategy.js");
const jwt_guard_js_1 = require("./guards/jwt.guard.js");
const roles_guard_js_1 = require("./guards/roles.guard.js");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_js_1.UsersModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_SECRET'),
                    signOptions: { expiresIn: '15m' },
                }),
            }),
        ],
        controllers: [auth_controller_js_1.AuthController],
        providers: [auth_service_js_1.AuthService, jwt_strategy_js_1.JwtStrategy, jwt_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard],
        exports: [auth_service_js_1.AuthService, jwt_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard],
    })
], AuthModule);
