import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma";

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const customer =
      await prisma.customer.findUnique({
        where: {
          email: normalizedEmail,
        },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          verificationStatus: true,
        },
      });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Make sure the stored password is a string
    const storedPassword =
      String(customer.password);

    const enteredPassword =
      String(password);

    const passwordMatches =
      await bcrypt.compare(
        enteredPassword,
        storedPassword
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message:
          "JWT secret is not configured",
      });
    }

    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
      },
      jwtSecret,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          verificationStatus:
            customer.verificationStatus,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Login failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}