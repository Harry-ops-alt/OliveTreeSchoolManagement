"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessRole = exports.ROLE_HIERARCHY = void 0;
exports.ROLE_HIERARCHY = {
    SUPER_ADMIN: 6,
    BRANCH_ADMIN: 5,
    ADMISSIONS: 4,
    TEACHER: 3,
    FINANCE: 2,
    PARENT: 1,
    STUDENT: 1,
};
const canAccessRole = (userRole, requiredRole) => exports.ROLE_HIERARCHY[userRole] >= exports.ROLE_HIERARCHY[requiredRole];
exports.canAccessRole = canAccessRole;
