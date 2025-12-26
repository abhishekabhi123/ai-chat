import type { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/httpError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      message: err instanceof Error ? err.message : "Unknown error",
      details: err instanceof HttpError ? err.details : undefined,
    },
  });
};
