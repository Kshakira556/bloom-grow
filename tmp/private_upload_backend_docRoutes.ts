import { Router } from "https://deno.land/x/oak/mod.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";

import {
  addDocumentController,
  createDocumentSignedUploadUrlController,
  deleteDocumentController,
  getDocumentController,
  getDocumentSignedUrlController,
  listDocumentsController,
  updateDocumentController,
} from "../controllers/documentController.ts";

const router = new Router({ prefix: "/api/vaults" });

router.post("/:vault_id/documents", authMiddleware, addDocumentController);
router.post("/:vault_id/documents/signed-upload", authMiddleware, createDocumentSignedUploadUrlController);
router.get("/:vault_id/documents", authMiddleware, listDocumentsController);
router.get("/documents/:id", authMiddleware, getDocumentController);
router.get("/documents/:id/signed-url", authMiddleware, getDocumentSignedUrlController);
router.put("/documents/:id", authMiddleware, updateDocumentController);
router.delete("/documents/:id", authMiddleware, deleteDocumentController);

export default router;
