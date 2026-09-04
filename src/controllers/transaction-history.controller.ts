import { Request, Response } from "express";

import prisma from "../config/prisma";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

export async function getTransactionHistory(
  req: Request,
  res: Response
) {
  try {
    // Get the authenticated customer ID
    // directly from the JWT token.
    const authenticatedReq =
      req as AuthenticatedRequest;

    const authenticatedCustomerId =
      authenticatedReq.customerId;

    if (!authenticatedCustomerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated customer ID is missing",
      });
    }

    // Find transactions belonging ONLY
    // to the authenticated customer.
    const transactions =
      await prisma.transaction.findMany({
        where: {
          customerId:
            authenticatedCustomerId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Transaction history retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error(
      "Transaction history error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve transaction history";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}