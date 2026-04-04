"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../lib/db");
class UserRepository {
    db;
    constructor(database) {
        this.db = database;
    }
    async findByEmail(email) {
        try {
            const user = await this.db.user.findUnique({
                where: { email },
            });
            return user;
        }
        catch (error) {
            console.error("[UserRepository] findByEmail failed:", error);
            throw new Error(`Could not find user by email: ${error.message}`);
        }
    }
    async findById(id) {
        try {
            const user = await this.db.user.findUnique({
                where: { id },
            });
            return user;
        }
        catch (error) {
            console.error("[UserRepository] findById failed:", error);
            throw new Error(`Could not find user by id: ${error.message}`);
        }
    }
    async findProfileById(id) {
        try {
            const user = await this.db.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return user;
        }
        catch (error) {
            console.error("[UserRepository] findProfileById failed:", error);
            throw new Error(`Could not fetch user profile: ${error.message}`);
        }
    }
    async emailExists(email) {
        try {
            const count = await this.db.user.count({ where: { email } });
            return count > 0;
        }
        catch (error) {
            console.error("[UserRepository] emailExists check failed:", error);
            throw new Error(`Could not check email existence: ${error.message}`);
        }
    }
    async create(input) {
        try {
            const user = await this.db.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    passwordHash: input.passwordHash,
                    role: input.role ?? client_1.Role.VIEWER,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                },
            });
            return user;
        }
        catch (error) {
            console.error("[UserRepository] create failed:", error);
            throw new Error(`Could not create user: ${error.message}`);
        }
    }
    async updatePassword(input) {
        try {
            const updated = await this.db.user.update({
                where: { id: input.id },
                data: { passwordHash: input.newPasswordHash },
                select: { id: true, email: true, updatedAt: true },
            });
            return updated;
        }
        catch (error) {
            console.error("[UserRepository] updatePassword failed:", error);
            throw new Error(`Could not update password: ${error.message}`);
        }
    }
    async updateRefreshToken(id, refreshToken) {
        try {
            const updated = await this.db.user.update({
                where: { id },
                data: refreshToken,
                select: { id: true },
            });
            return updated;
        }
        catch (error) {
            console.error("[UserRepository] updateRefreshToken failed:", error);
            throw new Error(`Could not update refresh token: ${error.message}`);
        }
    }
    async updateProfile(id, data) {
        try {
            const updated = await this.db.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    updatedAt: true,
                },
            });
            return updated;
        }
        catch (error) {
            console.error("[UserRepository] updateProfile failed:", error);
            throw new Error(`Could not update profile: ${error.message}`);
        }
    }
    async deleteById(id) {
        try {
            const deleted = await this.db.user.delete({
                where: { id },
                select: { id: true, email: true },
            });
            return deleted;
        }
        catch (error) {
            console.error("[UserRepository] deleteById failed:", error);
            throw new Error(`Could not delete user: ${error.message}`);
        }
    }
    async changingIsVerifiedStatus(email) {
        try {
            const updated = await this.db.user.update({
                where: { email },
                data: { isVerified: true },
            });
            return updated;
        }
        catch (error) {
            console.error("[UserRepository] changingIsVerifiedStatus failed:", error);
            throw new Error(`Could not verify user: ${error.message}`);
        }
    }
    async userDetails(email) {
        return this.findByEmail(email);
    }
    async userDetailsThroughId(id) {
        return this.findById(id);
    }
    async creatingStudent(userId) {
        console.log(`[UserRepository] User ${userId} is designated as a student (not implemented in schema).`);
        return { success: true };
    }
    async getAllUsers(skip, take) {
        try {
            return await this.db.user.findMany({
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        catch (error) {
            console.error("[UserRepository] getAllUsers failed:", error);
            throw new Error(`Could not fetch users: ${error.message}`);
        }
    }
    async countUsers() {
        try {
            return await this.db.user.count();
        }
        catch (error) {
            console.error("[UserRepository] countUsers failed:", error);
            throw new Error(`Could not count users: ${error.message}`);
        }
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository(db_1.database);
