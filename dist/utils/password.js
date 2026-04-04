"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePasswords = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Hashes a plain text password using bcrypt.
 * @param password Plain text password
 * @returns Hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return await bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Compares a plain text password with a hashed password.
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if matches, false otherwise
 */
const comparePasswords = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.comparePasswords = comparePasswords;
