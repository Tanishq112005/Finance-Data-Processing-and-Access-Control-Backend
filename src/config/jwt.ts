import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "./env";

export const jwtConfigAccessToken = {
  secret_key: JWT_SECRET,
  expiry_time: "15m" as jwt.SignOptions["expiresIn"],
  algorithm: "HS256" as jwt.Algorithm,
};

export const jwtConfigRefershToken = {
  secret_key: JWT_REFRESH_SECRET,
  expiry_time: "7d" as jwt.SignOptions["expiresIn"],
  algorithm: "HS256" as jwt.Algorithm,
};
