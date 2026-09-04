import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getAccountBalance } from "../services/nibss.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * GET /api/accounts/balance/:accountNumber
 *
 * Get the authenticated customer's account balance from NIBSS.
 *
 * SECURITY:
 * A customer can only view the balance of their own account.
 */
export async function getBalance(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq =
      req as AuthenticatedRequest;

    // 1. Get authenticated customer ID from JWT
    const authenticatedCustomerId =
      authenticatedReq.customerId;

    if (!authenticatedCustomerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated customer ID is missing",
      });
    }

    // 2. Get account number from URL
    const accountNumber = Array.isArray(
      req.params.accountNumber
    )
      ? req.params.accountNumber[0]
      : req.params.accountNumber;

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account number is required",
      });
    }

    // 3. Validate account number
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Account number must contain exactly 10 digits",
      });
    }

    // 4. Find the account
    const account =
      await prisma.account.findUnique({
        where: {
          accountNumber,
        },
      });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // 5. Verify account ownership
    if (
      account.customerId !==
      authenticatedCustomerId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view this account balance",
      });
    }

    // 6. Get current balance from NIBSS
    const nibssBalance =
      await getAccountBalance(
        accountNumber
      );

    // 7. Extract balance safely
    const responseData =
      nibssBalance?.data ||
      nibssBalance;

    const balance =
      responseData?.balance ??
      nibssBalance?.balance;

    if (
      balance === undefined ||
      balance === null
    ) {
      return res.status(502).json({
        success: false,
        message:
          "NIBSS returned a successful response but no balance was provided",
        data: nibssBalance,
      });
    }

    // 8. Synchronize local balance with NIBSS
    const updatedAccount =
      await prisma.account.update({
        where: {
          accountNumber,
        },
        data: {
          balance: Number(balance),
        },
      });

    // 9. Return balance
    return res.status(200).json({
      success: true,
      message:
        "Account balance retrieved successfully",
      data: {
        accountNumber:
          updatedAccount.accountNumber,
        accountName:
          updatedAccount.accountName,
        balance:
          updatedAccount.balance,
        currency: "NGN",
      },
    });
  } catch (error) {
    console.error(
      "Get account balance error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve account balance";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}