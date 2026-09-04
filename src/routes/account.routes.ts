import express from "express";

import {
  createAccount,
} from "../controllers/account.controller";

import {
  performNameEnquiry,
} from "../controllers/name-enquiry.controller";

import {
  getBalance,
} from "../controllers/balance.controller";

import {
  createTransfer,
} from "../controllers/transfer.controller";

import {
  getTransactionStatusController,
} from "../controllers/transaction.controller";

import {
  getTransactionHistory,
} from "../controllers/transaction-history.controller";

import {
  authenticateToken,
} from "../middleware/auth.middleware";

const router = express.Router();

// Protected: only an authenticated customer
// can create an account.
router.post(
  "/create",
  authenticateToken,
  createAccount
);

// Name enquiry
router.get(
  "/name-enquiry/:accountNumber",
  performNameEnquiry
);

// Protected: customers can only view
// the balance of their own account.
router.get(
  "/balance/:accountNumber",
  authenticateToken,
  getBalance
);

// Transfer
router.post(
  "/transfer",
  authenticateToken,
  createTransfer
);

// Transaction status
// Protected: only an authenticated customer
// can check transaction status.
router.get(
  "/transaction/:transactionId",
  authenticateToken,
  getTransactionStatusController
);

// Protected: customers can only access
// their own transaction history.
router.get(
  "/transactions",
  authenticateToken,
  getTransactionHistory
);

export default router;