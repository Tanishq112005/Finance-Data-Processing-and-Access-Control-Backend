import { Role } from "@prisma/client";

export interface userDetails {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface userSignInputDetails {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}
