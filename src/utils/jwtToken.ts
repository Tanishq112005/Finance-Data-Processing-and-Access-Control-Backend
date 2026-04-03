import jwt from "jsonwebtoken";
import {
  jwtPayloadAccessToken,
  jwtPayloadRefershToken,
} from "../types/jwt.types";
import { jwtConfigAccessToken, jwtConfigRefershToken } from "../config/jwt";

function generateAccessToken(payload: jwtPayloadAccessToken) {
  const options: jwt.SignOptions = {
    expiresIn: jwtConfigAccessToken.expiry_time,
    algorithm: jwtConfigAccessToken.algorithm,
  };
  return jwt.sign(payload, jwtConfigAccessToken.secret_key, options);
}

function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, jwtConfigAccessToken.secret_key);
    return decoded;
  } catch (err: any) {
    return err;
  }
}

function generateRefershToken(
  payload: jwtPayloadRefershToken,
  expireTime: jwt.SignOptions["expiresIn"],
) {
  const options: jwt.SignOptions = {
    expiresIn: expireTime,
    algorithm: jwtConfigRefershToken.algorithm,
  };
  return jwt.sign(payload, jwtConfigRefershToken.secret_key, options);
}

async function verifyRefershToken(token: string) {
  try {
    const decoded = jwt.verify(token, jwtConfigRefershToken.secret_key);
    return decoded;
  } catch (err: any) {
    return err;
  }
}

export {
  generateAccessToken,
  verifyAccessToken,
  generateRefershToken,
  verifyRefershToken,
};
