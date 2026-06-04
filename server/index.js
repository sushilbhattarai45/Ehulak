import express from "express";
import cors from "cors";
import emailRouter from "./src/routes/emailRouter.js";
import connectDb from "./src/db/connectDb.js";
import dotenv from "dotenv";
import authRouter from "./src/routes/authRouter.js";
import { authMiddleware } from "./src/middlewares/authMiddleware.js";
import { emailMiddleware } from "./src/middlewares/emailMiddleware.js";
import credsRouter from "./src/routes/credsRouter.js";
import smtpRouter from "./src/routes/smtpRouter.js";

dotenv.config();
const app = express();
app.use(cors());


app.use(express.json());
connectDb();
console.log("connecting to kafka and creating topics...");

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Welcome to the Ehulak API. This is version 2.0.1. v2");
});

app.use("/email", emailRouter);

app.use("/auth", authRouter);

app.use("/creds", authMiddleware, credsRouter);

app.use("/smtp", authMiddleware, smtpRouter);