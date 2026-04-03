import bcrypt from "bcryptjs";

/**
 * Hashes a plain text password using bcrypt.
 * @param password Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if matches, false otherwise
 */
export const comparePasswords = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
