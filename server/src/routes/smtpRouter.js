import { Router } from "express";
import { createSMTP, getSMTP, updateSMTP, getUserSMTPs, deleteSMTP, decryptSMTP } from "../controllers/smtpController.js";

const router = Router();

router.post("/create", createSMTP);
router.post("/decrypt", decryptSMTP);
router.get("/get", getSMTP);
router.post("/update", updateSMTP);
router.get("/getUserSMTPs", getUserSMTPs);
router.post("/delete", deleteSMTP);

export default router;