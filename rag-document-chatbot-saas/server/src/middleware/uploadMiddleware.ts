import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env.js";

const maxFileSize = Math.floor(env.maxPdfSizeMb * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new Error("Only PDF files are accepted."));
      return;
    }

    callback(null, true);
  },
});

export function uploadSinglePdf(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  upload.single("file")(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `PDF files must be ${env.maxPdfSizeMb}MB or smaller.`
          : error.message;

      response.status(400).json({
        error: "Invalid upload",
        message,
      });
      return;
    }

    if (error instanceof Error) {
      response.status(400).json({
        error: "Invalid upload",
        message: error.message,
      });
      return;
    }

    next();
  });
}
