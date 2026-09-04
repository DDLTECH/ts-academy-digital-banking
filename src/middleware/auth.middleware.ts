import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  customerId?: string;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization header must use Bearer token",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured",
      });
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as {
      customerId?: string;
      email?: string;
    };

    if (!decoded.customerId) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid token: customer ID is missing",
      });
    }

    req.customerId = decoded.customerId;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    if (
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    if (
      error instanceof jwt.JsonWebTokenError
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}