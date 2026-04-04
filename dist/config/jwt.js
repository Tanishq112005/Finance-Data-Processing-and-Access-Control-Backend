"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfigRefershToken = exports.jwtConfigAccessToken = void 0;
const env_1 = require("./env");
exports.jwtConfigAccessToken = {
    secret_key: env_1.JWT_SECRET,
    expiry_time: "15m",
    algorithm: "HS256",
};
exports.jwtConfigRefershToken = {
    secret_key: env_1.JWT_REFRESH_SECRET,
    expiry_time: "7d",
    algorithm: "HS256",
};
