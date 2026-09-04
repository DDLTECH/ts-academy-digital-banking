import { Request, Response } from "express";

import prisma from "../config/prisma";

import {
  getTransactionStatus,
} from "../services/nibss.service";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

/**
 * GET /api/accounts/transaction/:transactionId
 *
 * Retrieve transaction status from NIBSS.
 *
 * Security:
 * - Customer must be authenticated.
 * - Transaction must belong to the authenticated customer.
 */
export async function getTransactionStatusController(
  req: Request,
  res: Response
) {
  try {
    // Get the authenticated customer ID
    // from the JWT token.
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

    // Get transaction ID from URL.
    const transactionId = Array.isArray(
      req.params.transactionId
    )
      ? req.params.transactionId[0]
      : req.params.transactionId;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID is required",
      });
    }

    // Check whether this transaction exists
    // in our local database.
    //
    // We also check the customerId so that
    // one customer cannot access another
    // customer's transaction.
    const transaction =
      await prisma.transaction.findFirst({
        where: {
          reference: transactionId,
          customerId:
            authenticatedCustomerId,
        },
      });

    if (!transaction) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this transaction",
      });
    }

    // The transaction belongs to the
    // authenticated customer, so it is safe
    // to request the current status from NIBSS.
    const result =
      await getTransactionStatus(transactionId);

    return res.status(200).json({
      success: true,
      message:
        "Transaction status retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Transaction status error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve transaction status";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}