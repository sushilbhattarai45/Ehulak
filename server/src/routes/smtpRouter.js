import { Router } from "express";
import { createSMTP, getSMTP, updateSMTP, getUserSMTPs, deleteSMTP, decryptSMTP } from "../controllers/smtpController.js";

const router = Router();

router.post("/create", createSMTP);
router.post("/decrypt", decryptSMTP);
router.get("/get", getSMTP);
router.put("/update", updateSMTP);
router.get("/getUserSMTPs", getUserSMTPs);
router.post("/delete", deleteSMTP);

export default router;