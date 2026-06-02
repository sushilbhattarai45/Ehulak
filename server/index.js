import express from "express";
import cors from "cors";
import emailRouter from "./src/routes/emailRouter.js";
import connectDb from "./src/db/connectDb.js";
import dotenv from "dotenv";
import authRouter from "./src/routes/authRouter.js";
import { authMiddleware } from "./src/middlewares/authMiddleware.js";
import { emailMiddleware } from "./src/middlewares/emailMiddleware.js";
import credsRouter from "./src/routes/credsRouter.js";
dotenv.config();

const app = express();
app.use(cors());


app.use(express.json());
connectDb();
console.log("connecting to kafka and creating topics...");

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Hello World. testing the deployment v2");
});

app.use("/email", emailMiddleware, emailRouter);

app.use("/auth", authRouter);

app.use("/creds", authMiddleware, credsRouter);
