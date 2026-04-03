import express, { Request, Response, NextFunction } from "express";
import ApiError from "./utils/ApiError";
import ApiResponse from "./utils/ApiResponse";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./routes/auth.routes";

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse("Server is healthy", { uptime: process.uptime() }));
});

app.use("/api/v1/auth", authRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.errors?.status || 500).json(err);
  }

  console.error("[Unhandled Error]", err);
  return res
    .status(500)
    .json(new ApiError("Internal Server Error", { details: err.message }));
});

export default app;
