import { Router } from "express";
import { uploadDocument } from "../controllers/documentController.js";
import { uploadSinglePdf } from "../middleware/uploadMiddleware.js";

const router = Router();

router.get("/", (_request, response) => {
  response.status(200).json({
    message: "Authenticated document routes are available.",
  });
});

router.post("/upload", uploadSinglePdf, uploadDocument);

export default router;
