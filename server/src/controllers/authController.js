import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import ApiKeyModel from "../models/apiKeyModel.js";
import redisConfig from "../config/redisConfig.js";

import bcrypt from "bcrypt";
import { producer } from "../kafka/producer.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function issueAuthTokens(user, res) {
  const accessToken = jwt.sign(
    { userId: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const refreshToken = jwt.sign(
    { userId: user.userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "2d" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return {
    accessToken,
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      image: user.image,
      accountType: user.accountType,
      firstTimeLogin: user.firstTimeLogin ?? false,
      organization: user.organization || null,
      useCustomSMTP: user.useCustomSMTP === true,
    },
  };
}
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

    console.log("Refresh token:", refreshToken);
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
      return res.status(401).send({
        success: false,
        message: "Refresh token expired",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    return res.status(403).send({
      success: false,
      error: error.message,
      message: "Invalid refresh token",
      code: "INVALID_REFRESH_TOKEN",
    });
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
    if (user.accountType === "google") {
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

  if( user.status !="active")
  {
    return res.status(401).json({
      success: false,
      message: "User is not active",
    });
  }

    let firstTimeLogin = user.firstTimeLogin;
    if (firstTimeLogin === undefined) {
      const dbUser = await User.findOne({ email });
      firstTimeLogin = dbUser?.firstTimeLogin ?? true;
      user.firstTimeLogin = firstTimeLogin;
    }

    const { accessToken, user: userPayload } = issueAuthTokens(user, res);

    return res.json({
      success: true,
      message: "Login successful",
      accessToken,
      user: userPayload,
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
      firstTimeLogin: true,
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

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google sign-in is not configured on the server",
      });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name;
    const image = payload?.picture;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account email is required",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const cachedUser = await redisConfig.get(`user:${email}`);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
      }
    }

    if (user && user.accountType === "local") {
      return res.status(400).json({
        success: false,
        message:
          "This email is registered with a password. Please sign in with email and password.",
      });
    }

    if (!user) {
      const userId = crypto.randomBytes(16).toString("hex");
      const data = {
        userId,
        email,
        name,
        image,
        accountType: "google",
        status: "active",
        firstTimeLogin: true,
      };

      await redisConfig.set(`user:${email}`, JSON.stringify(data), "EX", 3600);

      await producer({
        type: "userActivity",
        action: "registerUser",
        data,
      });

      user = data;
    } else if (user.status && user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User is not active",
      });
    }

    await redisConfig.set(`user:${email}`, JSON.stringify(user), "EX", 3600);

    const { accessToken, user: userPayload } = issueAuthTokens(user, res);

    return res.json({
      success: true,
      message: "Google sign-in successful",
      accessToken,
      user: userPayload,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired Google sign-in",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logout successful" });
};

export const updateUser = async (req, res) => {
  try {
    const { userId, name, image, organization, useCustomSMTP } = req.body;

    console.log("Updating user with ID:", userId);
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }

    console.log(req.body);
    user.name = name || user.name;
    user.image = image || user.image;
    user.organization = organization || user.organization;
    user.status = "active";
    user.firstTimeLogin = false;
    if (typeof useCustomSMTP === "boolean") {
      user.useCustomSMTP = useCustomSMTP;
    }

    await user.save();

    // Update Redis cache
    await redisConfig.set(`user:${user.email}`, JSON.stringify(user));

    return res.json({
      success: true,
      message: "User updated successfully",
      user: {
        userId: user.userId,
        email: user.email,
        status: 'active',
        name: user.name,
        image: user.image,
        accountType: user.accountType,
        userStatus: user.status,
        firstTimeLogin: user.firstTimeLogin,
        useCustomSMTP: user.useCustomSMTP,
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


export const createOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Creating OTP for email:", email);
    //generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("OTP:", otp);
// set the OTP in redis with the email as the key and the OTP as the value and the expiration time as 5 minutes
    await redisConfig.set(`otp:${email}`, otp, "EX", 60 * 5);


await producer({
  type: "email",
  action: "sendEmail",
  emailData: {
    from: "noreply@ehulak.tech",
    to: email,
    campaign: "OTP for login",
    subject: "OTP for login from Ehulak",
    body: `Your OTP for login is ${otp}`,
    html:`"<div style=\"margin:0;padding:0;background:#0b0f1a;font-family:Arial,sans-serif;\"><div style=\"max-width:600px;margin:40px auto;background:#111827;border-radius:0px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);\"><div style=\"background:linear-gradient(135deg,#6d28d9,#2563eb);padding:30px;text-align:center;color:white;\"><h1 style=\"margin:0;font-size:24px;\">Ehulak Security Code</h1><p style=\"margin:8px 0 0;opacity:0.9;\">One-Time Password Verification</p></div><div style=\"padding:40px;text-align:center;color:#e5e7eb;\"><p style=\"font-size:16px;margin-bottom:20px;color:#9ca3af;\">Use the OTP below to continue your action</p><div style=\"font-size:36px;letter-spacing:8px;font-weight:bold;background:#0f172a;padding:16px 20px;border-radius:12px;display:inline-block;border:1px solid #1f2937;\">
    
    ${otp}</div><p style=\"margin-top:25px;font-size:14px;color:#6b7280;\">This code will expire in 10 minutes. Do not share it with anyone.</p><a href=\"#\" style=\"display:inline-block;margin-top:25px;padding:12px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;\">Secure Account</a></div><div style=\"padding:20px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #1f2937;\">Sent from <b>noreply@ehulak.tech</b></div></div></div>"
}`,
    userId: "1234567890",
  },
});


    return res.json({
      success: true,
      message: "OTP created successfully", otp: otp    });
    

  } catch (error) {
    console.error("Create OTP error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const validateOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedOTP = await redisConfig.get(`otp:${email}`);
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }
    if (String(storedOTP) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await redisConfig.del(`otp:${email}`);
    return res.json({ success: true, message: "OTP validated successfully" });
  } catch (error) {
    console.error("Validate OTP error:", error);
    return res.status(500)
      .json({ success: false, message: "Internal server error" });
  }
};