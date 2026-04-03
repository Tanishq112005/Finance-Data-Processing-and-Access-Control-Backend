import { Prisma, Role, PrismaClient, User } from "@prisma/client";
import { database } from "../lib/db";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}

export interface UpdatePasswordInput {
  id: string;
  newPasswordHash: string;
}

export class UserRepository {
  private db: PrismaClient;
  constructor(database: PrismaClient) {
    this.db = database;
  }
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error("[UserRepository] findByEmail failed:", error);
      throw new Error(
        `Could not find user by email: ${(error as Error).message}`,
      );
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.db.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      console.error("[UserRepository] findById failed:", error);
      throw new Error(`Could not find user by id: ${(error as Error).message}`);
    }
  }

  async findProfileById(id: string) {
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
    } catch (error) {
      console.error("[UserRepository] findProfileById failed:", error);
      throw new Error(
        `Could not fetch user profile: ${(error as Error).message}`,
      );
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.db.user.count({ where: { email } });
      return count > 0;
    } catch (error) {
      console.error("[UserRepository] emailExists check failed:", error);
      throw new Error(
        `Could not check email existence: ${(error as Error).message}`,
      );
    }
  }

  async create(input: CreateUserInput) {
    try {
      const user = await this.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role ?? Role.VIEWER,
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
    } catch (error) {
      console.error("[UserRepository] create failed:", error);
      throw new Error(`Could not create user: ${(error as Error).message}`);
    }
  }

  async updatePassword(input: UpdatePasswordInput) {
    try {
      const updated = await this.db.user.update({
        where: { id: input.id },
        data: { passwordHash: input.newPasswordHash },
        select: { id: true, email: true, updatedAt: true },
      });
      return updated;
    } catch (error) {
      console.error("[UserRepository] updatePassword failed:", error);
      throw new Error(`Could not update password: ${(error as Error).message}`);
    }
  }

  async updateRefreshToken(id: string, refreshToken: any) {
    try {
      const updated = await this.db.user.update({
        where: { id },
        data: refreshToken,
        select: { id: true },
      });
      return updated;
    } catch (error) {
      console.error("[UserRepository] updateRefreshToken failed:", error);
      throw new Error(
        `Could not update refresh token: ${(error as Error).message}`,
      );
    }
  }

  async updateProfile(
    id: string,
    data: Partial<Pick<CreateUserInput, "name" | "role">> &
      Partial<{ isActive: boolean; isVerified: boolean }>,
  ) {
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
    } catch (error) {
      console.error("[UserRepository] updateProfile failed:", error);
      throw new Error(`Could not update profile: ${(error as Error).message}`);
    }
  }

  async deleteById(id: string) {
    try {
      const deleted = await this.db.user.delete({
        where: { id },
        select: { id: true, email: true },
      });
      return deleted;
    } catch (error) {
      console.error("[UserRepository] deleteById failed:", error);
      throw new Error(`Could not delete user: ${(error as Error).message}`);
    }
  }

  async changingIsVerifiedStatus(email: string) {
    try {
      const updated = await this.db.user.update({
        where: { email },
        data: { isVerified: true },
      });
      return updated;
    } catch (error) {
      console.error("[UserRepository] changingIsVerifiedStatus failed:", error);
      throw new Error(`Could not verify user: ${(error as Error).message}`);
    }
  }

  async userDetails(email: string) {
    return this.findByEmail(email);
  }

  async userDetailsThroughId(id: string) {
    return this.findById(id);
  }

  async creatingStudent(userId: string) {
    console.log(
      `[UserRepository] User ${userId} is designated as a student (not implemented in schema).`,
    );
    return { success: true };
  }

  async getAllUsers(skip?: number, take?: number) {
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
    } catch (error) {
      console.error("[UserRepository] getAllUsers failed:", error);
      throw new Error(`Could not fetch users: ${(error as Error).message}`);
    }
  }

  async countUsers() {
    try {
      return await this.db.user.count();
    } catch (error) {
      console.error("[UserRepository] countUsers failed:", error);
      throw new Error(`Could not count users: ${(error as Error).message}`);
    }
  }
}

export const userRepository = new UserRepository(database);
