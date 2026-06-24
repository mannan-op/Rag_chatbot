import { Router } from "express";
import { chatWithDocument } from "../controllers/chatController.js";

const router = Router();

router.get("/", (_request, response) => {
  response.status(200).json({
    message: "Authenticated chat routes are available.",
  });
});

router.post("/:documentId", chatWithDocument);

export default router;
