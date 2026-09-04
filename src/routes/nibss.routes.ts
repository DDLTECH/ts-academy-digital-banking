import express from "express";

import {
  onboardFintech,
  getNibsToken,
  getNibsAccounts,
} from "../services/nibss.service";

const router = express.Router();

/**
 * POST /api/nibss/onboard
 *
 * Onboard our fintech with NIBSS.
 */
router.post("/onboard", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const result = await onboardFintech(name, email);

    return res.status(201).json({
      success: true,
      message: "Fintech onboarded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Fintech onboarding error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Fintech onboarding failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

/**
 * POST /api/nibss/token
 *
 * Authenticate with NIBSS and obtain a JWT token.
 */
router.post("/token", async (req, res) => {
  try {
    const result = await getNibsToken();

    return res.status(200).json({
      success: true,
      message: "NIBSS authentication successful",
      data: result,
    });
  } catch (error) {
    console.error("NIBSS authentication error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "NIBSS authentication failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

/**
 * GET /api/nibss/accounts
 *
 * Retrieve accounts from NIBSS.
 */
router.get("/accounts", async (req, res) => {
  try {
    const result = await getNibsAccounts();

    return res.status(200).json({
      success: true,
      message: "NIBSS accounts retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get NIBSS accounts error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve NIBSS accounts";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

export default router;