import { Request, Response } from "express";

import prisma from "../config/prisma";

import {
  getAccountBalance,
  nameEnquiry,
  performTransfer,
} from "../services/nibss.service";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

/**
 * POST /api/accounts/transfer
 *
 * Perform an intra-bank or inter-bank transfer.
 *
 * SECURITY:
 * The authenticated customer's identity comes
 * from the JWT token. A customer can only transfer
 * money from their own account.
 */
export async function createTransfer(
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

    const {
      customerId,
      from,
      to,
      amount,
      description,
    } = req.body;

    // 2. If customerId is supplied in the request,
    // it MUST match the authenticated customer.
    if (
      customerId &&
      String(customerId) !==
        String(authenticatedCustomerId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot make a transfer for another customer",
      });
    }

    // 3. Validate required fields
    if (
      !from ||
      !to ||
      amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "from, to and amount are required",
      });
    }

    // 4. Validate account numbers
    if (
      !/^\d{10}$/.test(
        String(from)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sender account number must contain exactly 10 digits",
      });
    }

    if (
      !/^\d{10}$/.test(
        String(to)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient account number must contain exactly 10 digits",
      });
    }

    // 5. Prevent transfer to same account
    if (
      String(from) ===
      String(to)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sender and recipient accounts cannot be the same",
      });
    }

    // 6. Validate amount
    const transferAmount =
      Number(amount);

    if (
      !Number.isFinite(
        transferAmount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a valid number",
      });
    }

    if (
      transferAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transfer amount must be greater than zero",
      });
    }

    if (
      Math.round(
        transferAmount * 100
      ) !==
      transferAmount * 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount can have a maximum of two decimal places",
      });
    }

    // 7. Find the authenticated customer
    const customer =
      await prisma.customer.findUnique({
        where: {
          id: authenticatedCustomerId,
        },
        include: {
          account: true,
        },
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }

    // 8. Customer must be verified
    if (
      customer.verificationStatus !==
      "VERIFIED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Customer must be verified before making a transfer",
      });
    }

    // 9. Customer must have an account
    if (!customer.account) {
      return res.status(404).json({
        success: false,
        message:
          "Customer does not have a bank account",
      });
    }

    // 10. CRITICAL SECURITY CHECK:
    // The sender account must belong to
    // the authenticated customer.
    if (
      customer.account.accountNumber !==
      String(from)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to transfer from this account",
      });
    }

    // 11. Get current balance from NIBSS
    const balanceResponse =
      await getAccountBalance(
        String(from)
      );

    const balanceData =
      balanceResponse?.data ||
      balanceResponse;

    const currentBalance =
      Number(
        balanceData?.balance
      );

    if (
      !Number.isFinite(
        currentBalance
      )
    ) {
      return res.status(502).json({
        success: false,
        message:
          "Could not determine current account balance",
      });
    }

    // 12. Check sufficient funds
    if (
      currentBalance <
      transferAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient funds",
        data: {
          accountNumber:
            String(from),
          availableBalance:
            currentBalance,
          requestedAmount:
            transferAmount,
          currency:
            "NGN",
        },
      });
    }

    // 13. Perform recipient name enquiry
    let recipientDetails;

    try {
      recipientDetails =
        await nameEnquiry(
          String(to)
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient account name enquiry failed. Transfer cancelled.",
        error:
          error instanceof Error
            ? error.message
            : "Name enquiry failed",
      });
    }

    const recipientData =
      recipientDetails?.data ||
      recipientDetails;

    const recipientName =
      recipientData?.accountName;

    if (!recipientName) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient account could not be verified. Transfer cancelled.",
      });
    }

    // 14. Perform NIBSS transfer
    let transferResponse;

    try {
      transferResponse =
        await performTransfer(
          String(from),
          String(to),
          transferAmount
        );
    } catch (error) {
      console.error(
        "NIBSS transfer failed:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          "NIBSS transfer failed. No local balance was changed.",
        error:
          error instanceof Error
            ? error.message
            : "Transfer failed",
      });
    }

    console.log(
      "NIBSS transfer response:",
      transferResponse
    );

    // 15. Extract NIBSS transaction identifier
    const transactionId =
      transferResponse?.transactionId ||
      transferResponse?.data?.transactionId ||
      transferResponse?.reference ||
      transferResponse?.data?.reference ||
      transferResponse?._id ||
      transferResponse?.data?._id;

    if (!transactionId) {
      return res.status(502).json({
        success: false,
        message:
          "NIBSS transfer response did not contain a transaction identifier",
        data:
          transferResponse,
      });
    }

    // 16. Determine transfer status
    const transferStatus =
      transferResponse?.status ||
      transferResponse?.data?.status ||
      "SUCCESS";

    if (
      String(
        transferStatus
      ).toUpperCase() !==
      "SUCCESS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "NIBSS did not confirm the transfer as successful",
        data: {
          transactionId,
          status:
            transferStatus,
        },
      });
    }

    // 17. Create our local transaction reference
    const reference =
      `TXN-${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}`;

    // 18. Calculate new local sender balance
    const newBalance =
      currentBalance -
      transferAmount;

    // 19. Update local sender balance
    await prisma.account.update({
      where: {
        id:
          customer.account.id,
      },
      data: {
        balance:
          newBalance,
      },
    });

    // 20. If recipient is one of our local accounts,
    // update recipient's local balance.
    const recipientAccount =
      await prisma.account.findUnique({
        where: {
          accountNumber:
            String(to),
        },
      });

    if (recipientAccount) {
      await prisma.account.update({
        where: {
          id:
            recipientAccount.id,
        },
        data: {
          balance: {
            increment:
              transferAmount,
          },
        },
      });
    }

    // 21. Save transaction locally
    const transaction =
      await prisma.transaction.create({
        data: {
          customerId:
            customer.id,

          accountId:
            customer.account.id,

          senderAccount:
            String(from),

          recipientAccount:
            String(to),

          recipientBank:
            recipientData?.bankCode
              ? String(
                  recipientData.bankCode
                )
              : "NIBSS",

          amount:
            transferAmount,

          type:
            "TRANSFER",

          reference,

          status:
            "SUCCESS",

          description:
            description ||
            `Transfer to ${recipientName}`,
        },
      });

    // 22. Return successful response
    return res.status(201).json({
      success: true,
      message:
        "Transfer successful",

      data: {
        transactionId,

        reference:
          transaction.reference,

        from:
          String(from),

        to:
          String(to),

        recipientName,

        amount:
          transferAmount,

        status:
          "SUCCESS",

        balance:
          newBalance,

        currency:
          "NGN",

        description:
          transaction.description,

        createdAt:
          transaction.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Transfer error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Transfer failed";

    return res.status(500).json({
      success: false,
      message:
        errorMessage,
    });
  }
}