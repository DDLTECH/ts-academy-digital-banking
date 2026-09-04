import { Request, Response } from "express";
import { nameEnquiry } from "../services/nibss.service";

/**
 * GET /api/accounts/name-enquiry/:accountNumber
 *
 * Perform NIBSS account name enquiry.
 */
export async function performNameEnquiry(
  req: Request,
  res: Response
) {
  try {
    const accountNumber = Array.isArray(
      req.params.accountNumber
    )
      ? req.params.accountNumber[0]
      : req.params.accountNumber;

    // Validate account number
    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account number is required",
      });
    }

    // Nigerian account numbers are normally 10 digits
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Account number must contain exactly 10 digits",
      });
    }

    // Call NIBSS
    const result = await nameEnquiry(accountNumber);

    return res.status(200).json({
      success: true,
      message: "Name enquiry successful",
      data: result,
    });
  } catch (error) {
    console.error("Name enquiry error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Name enquiry failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}