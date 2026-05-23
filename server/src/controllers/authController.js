import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";

import bcrypt from "bcrypt";
import { producer } from "../kafka/producer.js";
// export const login = (req, res) => {
//   const { email, password } = req.body;

//   //check if user exists in redis cache
//   redisConfig.get(`user:${email}`, (err, userData) => {
//     if (err) {
//       console.error("Error accessing Redis:", err);
//       return res
//         .status(500)
//         .json({ success: false, message: "Internal server error" });
//     }
//     if (userData) {
//       const user = JSON.parse(userData);
//       const hashedPassword = crypto
//         .createHash("sha256")
//         .update(password)
//         .digest("hex");
//       if (user.password === hashedPassword) {
//         const token = jwt.sign(
//           { userId: user.userId },
//           process.env.JWT_SECRET,
//           {
//             expiresIn: "1h",
//           },
//         );
//         const refreshToken = jwt.sign(
//           { userId: user.userId },
//           process.env.REFRESH_TOKEN_SECRET,
//           {
//             expiresIn: "7d",
//           },
//         );

//         res.cookie("refreshToken", refreshToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "Strict",
//         });
//         return res.json({
//           success: true,
//           message: "Login successful",
//           accessToken: token,
//         });
//       } else {
//         return res
//           .status(401)
//           .json({ success: false, message: "Invalid credentials" });
//       }
//     } else {
//       return res
//         .status(401)
//         .json({ success: false, message: "User not found" });
//     }
//   });
// };

export const refreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token missing" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send("Refresh token expired");
    }

    return res.status(403).send("Invalid refresh token");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check Redis cache first
    let cachedUser = await redisConfig.get(`user:${email}`);
    let user;
    console.log("Login attempt for email:", email);

    console.log("Checking Redis cache for user:", cachedUser);
    if (cachedUser) {
      user = JSON.parse(cachedUser);

      console.log("User found in Redis cache:", user);
    } else {
      // 2. Fallback to DB
      user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // 3. Cache user
      await redisConfig.set(`user:${email}`, JSON.stringify(user), "EX", 3600);
    }

    // 4. STRICT RULE: block if user signed up with Google
    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google login. Please sign in with Google.",
      });
    }

    // 5. Ensure password exists
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "No password set for this account.",
      });
    }

    // 6. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 7. Generate tokens
    const accessToken = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    // 8. Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // 9. Response
    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        image: user.image,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const registerUser = async (req, res) => {
  try {
    const { email, name, image, accountType, status, password } = req.body;

    console.log(
      "Registering user with email:",
      email,
      "and accountType:",
      accountType,
    );
    if (!["local", "google"].includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type",
      });
    }

    if (accountType === "local" && !password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for local accounts",
      });
    }

    // 3. Check DB first (source of truth)
    //check redis
    const cachedUser = await redisConfig.get(`user:${email}`);
    if (cachedUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // 4. Hash password safely
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // 5. Create user
    const userId = crypto.randomBytes(16).toString("hex");

    const data = {
      userId,
      email,
      name,
      image,
      accountType,
      status: status || "active",
      password: hashedPassword,
    };

    // 6. Cache in Redis (use email as key)
    await redisConfig.set(`user:${email}`, JSON.stringify(data));

    // 7. Queue async processing
    await producer({
      type: "userActivity",
      action: "registerUser",
      data,
    });

    return res.json({
      success: true,
      message: "User registered successfully",
      userId,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logout successful" });
};

export const updateUser = async (req, res) => {
  try {
    const { userId, name, image, organization } = req.body;

    console.log("Updating user with ID:", userId);
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name || user.name;
    user.image = image || user.image;
    user.organization = organization || user.organization;

    await user.save();

    // Update Redis cache
    await redisConfig.set(`user:${user.email}`, JSON.stringify(user));

    return res.json({
      success: true,
      message: "User updated successfully",
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        image: user.image,
        accountType: user.accountType,
        organization: user.organization || null,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
