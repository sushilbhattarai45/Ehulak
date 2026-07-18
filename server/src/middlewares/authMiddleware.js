import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)

        .json({ success: false, message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
       if(err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: false, message: "Token expired",
            code: "TOKEN_EXPIRED",
           });
       } else {
        return res
          .status(401)
          .json({ success: false, message: "Invalid token",
            code: "INVALID_TOKEN",
           });
       }
      }
      console.log("Decoded token in authMiddleware:", decoded);
      req.user = decoded;
      
      console.log("Decoded user in authMiddleware:", req.user); // Attach decoded user info to request object
      next();
    });
  } catch (error) {
    console.error("Error in authMiddleware:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
