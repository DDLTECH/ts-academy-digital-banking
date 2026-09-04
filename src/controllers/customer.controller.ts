import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import prisma from "../config/prisma";
import {
  validateBvn,
  validateNin,
} from "../services/nibss.service";

export async function onboardCustomer(
  req: Request,
  res: Response
) {
  try {
    const {
      email,
      password,
      kycType,
      kycId,
    } = req.body;

    if (
      !email ||
      !password ||
      !kycType ||
      !kycId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password, kycType and kycId are required",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    if (
      kycType !== "bvn" &&
      kycType !== "nin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "kycType must be either 'bvn' or 'nin'",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address",
      });
    }

    if (!/^\d{11}$/.test(kycId)) {
      return res.status(400).json({
        success: false,
        message:
          "BVN or NIN must contain exactly 11 digits",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingCustomer =
      await prisma.customer.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message:
          "A customer with this email already exists",
      });
    }

    if (kycType === "bvn") {
      const existingBvn =
        await prisma.customer.findUnique({
          where: {
            bvn: kycId,
          },
        });

      if (existingBvn) {
        return res.status(409).json({
          success: false,
          message:
            "This BVN has already been registered",
        });
      }
    }

    if (kycType === "nin") {
      const existingNin =
        await prisma.customer.findUnique({
          where: {
            nin: kycId,
          },
        });

      if (existingNin) {
        return res.status(409).json({
          success: false,
          message:
            "This NIN has already been registered",
        });
      }
    }

    const verification =
      kycType === "bvn"
        ? await validateBvn(kycId)
        : await validateNin(kycId);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message:
          "Customer verification failed",
      });
    }

    if (
      !verification.firstName ||
      !verification.lastName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer verification succeeded but customer information was incomplete",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const customer =
      await prisma.customer.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName:
            verification.firstName,
          lastName:
            verification.lastName,
          bvn:
            kycType === "bvn"
              ? kycId
              : undefined,
          nin:
            kycType === "nin"
              ? kycId
              : undefined,
          verificationStatus:
            "VERIFIED",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          bvn: true,
          nin: true,
          verificationStatus: true,
          createdAt: true,
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Customer onboarded and verified successfully",
      data: customer,
    });
  } catch (error) {
    console.error(
      "Customer onboarding error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Customer onboarding failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

export async function getCustomer(
  req: Request,
  res: Response
) {
  try {
    const id = Array.isArray(
      req.params.id
    )
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Customer ID is required",
      });
    }

    const customer =
      await prisma.customer.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          verificationStatus: true,
          createdAt: true,
          account: {
            select: {
              id: true,
              accountNumber: true,
              accountName: true,
              balance: true,
              bankCode: true,
            },
          },
        },
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Customer retrieved successfully",
      data: customer,
    });
  } catch (error) {
    console.error(
      "Get customer error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve customer";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}