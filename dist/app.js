"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const ApiResponse_1 = __importDefault(require("./utils/ApiResponse"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
app.get("/health", (req, res) => {
    res
        .status(200)
        .json(new ApiResponse_1.default("Server is healthy", { uptime: process.uptime() }));
});
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/finance", finance_routes_1.default);
app.use((err, req, res, next) => {
    if (err instanceof ApiError_1.default) {
        return res.status(err.errors?.status || 500).json(err);
    }
    console.error("[Unhandled Error]", err);
    return res
        .status(500)
        .json(new ApiError_1.default("Internal Server Error", { details: err.message }));
});
exports.default = app;
