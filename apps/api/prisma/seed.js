"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2_1 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    const organization = await prisma.organization.upsert({
        where: { id: "olive-tree-schools" }, // ✅ use a unique ID
        update: {},
        create: {
            id: "olive-tree-schools", // must match unique field
            name: "Olive Tree Schools",
        },
    });
    const adminPassword = await (0, argon2_1.hash)("AdminPass123!");
    const samplePassword = await (0, argon2_1.hash)("SampleUser123!");
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
    const sampleUser = await prisma.user.upsert({
        where: { email: "admissions@olive.school" },
        update: {},
        create: {
            email: "admissions@olive.school",
            passwordHash: samplePassword,
            firstName: "Admissions",
            lastName: "User",
            role: "ADMISSIONS",
            organization: {
                connect: { id: organization.id },
            },
        },
    });
    console.log("Seeded organization:", organization.id);
    console.log("Seeded admin user:", adminUser.email);
    console.log("Seeded sample user:", sampleUser.email);
}
main()
    .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
