import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getNibsToken } from "../services/nibss.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const NIBSS_BASE_URL =
  process.env.NIBSS_BASE_URL ||
  "https://nibssbyphoenix.onrender.com";

/**
 * POST /api/accounts/create
 *
 * Create or synchronize a bank account for a verified customer.
 *
 * SECURITY:
 * The customer identity comes from the verified JWT token.
 * The customerId supplied in the request body is only accepted
 * when it matches the authenticated customer.
 */
export async function createAccount(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq =
      req as AuthenticatedRequest;

    // 1. Get the authenticated customer ID from JWT
    const authenticatedCustomerId =
      authenticatedReq.customerId;

    if (!authenticatedCustomerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated customer ID is missing",
      });
    }

    // 2. Get request data
    const { customerId, dob } = req.body;

    // Customer ID is no longer the source of identity.
    // If supplied, it must match the JWT customer ID.
    if (
      customerId &&
      String(customerId) !==
        String(authenticatedCustomerId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot create an account for another customer",
      });
    }

    // 3. Validate DOB
    if (!dob) {
      return res.status(400).json({
        success: false,
        message: "dob is required",
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        String(dob)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "dob must be in YYYY-MM-DD format",
      });
    }

    // 4. Find the authenticated customer
    const customer =
      await prisma.customer.findUnique({
        where: {
          id: authenticatedCustomerId,
        },
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 5. Customer must be verified
    if (
      customer.verificationStatus !==
      "VERIFIED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Customer must be verified before creating an account",
      });
    }

    // 6. Check if customer already has a local account
    const existingAccount =
      await prisma.account.findUnique({
        where: {
          customerId: customer.id,
        },
      });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message:
          "Customer already has an account",
        data: {
          accountId: existingAccount.id,
          accountNumber:
            existingAccount.accountNumber,
          accountName:
            existingAccount.accountName,
          bankCode:
            existingAccount.bankCode,
          balance:
            existingAccount.balance,
          currency: "NGN",
        },
      });
    }

    // 7. Determine KYC type
    let kycType: "bvn" | "nin";
    let kycID: string;

    if (customer.bvn) {
      kycType = "bvn";
      kycID = customer.bvn;
    } else if (customer.nin) {
      kycType = "nin";
      kycID = customer.nin;
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Customer does not have a verified BVN or NIN",
      });
    }

    // 8. Authenticate with NIBSS
    const tokenResponse =
      await getNibsToken();

    const token =
      tokenResponse.token;

    if (!token) {
      return res.status(502).json({
        success: false,
        message:
          "NIBSS authentication succeeded but no token was returned",
      });
    }

    // 9. Try to create the account with NIBSS
    const nibssResponse =
      await fetch(
        `${NIBSS_BASE_URL}/api/account/create`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            kycType,
            kycID,
            dob,
          }),
        }
      );

    const nibssData =
      await nibssResponse.json();

    console.log(
      "NIBSS account creation response:"
    );
    console.log(nibssData);

    /*
     * If NIBSS says the BVN/NIN is already linked
     * to an account, retrieve that account and
     * synchronize it locally.
     */
    if (
      !nibssResponse.ok &&
      typeof nibssData?.message ===
        "string" &&
      nibssData.message
        .toLowerCase()
        .includes("already linked")
    ) {
      console.log(
        "Account already exists at NIBSS. Retrieving existing account..."
      );

      const accountsResponse =
        await fetch(
          `${NIBSS_BASE_URL}/api/accounts`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      const accountsData =
        await accountsResponse.json();

      if (!accountsResponse.ok) {
        return res.status(
          accountsResponse.status
        ).json({
          success: false,
          message:
            accountsData?.message ||
            "Could not retrieve existing NIBSS account",
          data: accountsData,
        });
      }

      /*
       * NIBSS normally returns:
       *
       * {
       *   accounts: [...]
       * }
       *
       * Support both accounts and nested data.accounts.
       */
      const accounts =
        accountsData?.accounts ||
        accountsData?.data?.accounts ||
        [];

      if (!Array.isArray(accounts)) {
        return res.status(502).json({
          success: false,
          message:
            "NIBSS returned an invalid accounts response",
          data: accountsData,
        });
      }

      // Find account belonging to this customer's KYC
      const matchingAccount =
        accounts.find(
          (account: any) =>
            String(account?.kycID) ===
              String(kycID) &&
            String(
              account?.kycType
            ).toLowerCase() ===
              kycType.toLowerCase()
        );

      if (!matchingAccount) {
        return res.status(404).json({
          success: false,
          message:
            "NIBSS says the KYC is linked to an account, but the account could not be found",
        });
      }

      if (
        !matchingAccount.accountNumber
      ) {
        return res.status(502).json({
          success: false,
          message:
            "NIBSS account was found but no account number was returned",
          data: matchingAccount,
        });
      }

      // Save existing NIBSS account locally
      const account =
        await prisma.account.create({
          data: {
            customerId:
              customer.id,

            accountNumber:
              String(
                matchingAccount.accountNumber
              ),

            accountName:
              matchingAccount.accountName ||
              `${customer.firstName} ${customer.lastName}`,

            balance:
              Number(
                matchingAccount.balance ??
                  15000
              ),

            bankCode:
              String(
                matchingAccount.bankCode ||
                  tokenResponse.fintech
                    ?.bankCode ||
                  ""
              ),
          },
        });

      return res.status(201).json({
        success: true,
        message:
          "Existing NIBSS account synchronized successfully",

        data: {
          accountId: account.id,
          accountNumber:
            account.accountNumber,
          accountName:
            account.accountName,
          bankCode:
            account.bankCode,
          balance:
            account.balance,
          currency: "NGN",
        },
      });
    }

    // 10. Handle other NIBSS errors
    if (!nibssResponse.ok) {
      return res.status(
        nibssResponse.status
      ).json({
        success: false,
        message:
          nibssData?.message ||
          "NIBSS account creation failed",
        data: nibssData,
      });
    }

    /*
     * 11. Extract account information.
     */
    const accountData =
      nibssData?.account ||
      nibssData?.data?.account ||
      nibssData?.data ||
      nibssData;

    const accountNumber =
      accountData?.accountNumber;

    const accountName =
      accountData?.accountName ||
      `${customer.firstName} ${customer.lastName}`;

    const bankCode =
      accountData?.bankCode ||
      tokenResponse.fintech
        ?.bankCode ||
      "";

    const balance =
      accountData?.balance ??
      15000;

    // 12. Make sure an account number was returned
    if (!accountNumber) {
      return res.status(502).json({
        success: false,
        message:
          "NIBSS account creation succeeded but no account number was returned",
        data: nibssData,
      });
    }

    // 13. Validate account number
    if (
      !/^\d{10}$/.test(
        String(accountNumber)
      )
    ) {
      return res.status(502).json({
        success: false,
        message:
          "NIBSS returned an invalid account number",
        data: {
          accountNumber,
        },
      });
    }

    // 14. Save newly created account locally
    const account =
      await prisma.account.create({
        data: {
          customerId:
            customer.id,
          accountNumber:
            String(accountNumber),
          accountName:
            String(accountName),
          balance:
            Number(balance),
          bankCode:
            String(bankCode),
        },
      });

    // 15. Return account
    return res.status(201).json({
      success: true,
      message:
        "Account created successfully",
      data: {
        accountId: account.id,
        accountNumber:
          account.accountNumber,
        accountName:
          account.accountName,
        bankCode:
          account.bankCode,
        balance:
          account.balance,
        currency: "NGN",
      },
    });
  } catch (error) {
    console.error(
      "Account creation error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Account creation failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}