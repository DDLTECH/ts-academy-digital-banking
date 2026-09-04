import "dotenv/config";

import {
  NIBSS_BASE_URL,
  NIBSS_API_KEY,
  NIBSS_API_SECRET,
} from "../config/nibss";

interface OnboardingResponse {
  apiKey: string;
  apiSecret: string;
  bankCode: string;
  bankName: string;
}

interface TokenResponse {
  token: string;
  fintech: {
    name: string;
    email: string;
    bankCode: string;
    bankName: string;
  };
}

interface VerificationResponse {
  valid: boolean;
  bvn?: string;
  nin?: string;
  firstName: string;
  lastName: string;
  dob: string;
}

/**
 * Onboard fintech with NIBSS.
 */
export async function onboardFintech(
  name: string,
  email: string
): Promise<OnboardingResponse> {
  const response = await fetch(
    `${NIBSS_BASE_URL}/api/fintech/onboard`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "NIBSS fintech onboarding failed"
    );
  }

  return data;
}

/**
 * Get NIBSS JWT token.
 */
export async function getNibsToken(): Promise<TokenResponse> {
  if (
    !NIBSS_API_KEY ||
    !NIBSS_API_SECRET
  ) {
    throw new Error(
      "NIBSS API key and API secret are not configured in .env"
    );
  }

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/auth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: NIBSS_API_KEY,
        apiSecret: NIBSS_API_SECRET,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "NIBSS authentication failed"
    );
  }

  return data;
}

/**
 * Insert a test BVN into NIBSS.
 *
 * This is intended for sandbox/testing only.
 */
export async function insertBvn(
  bvn: string,
  firstName: string,
  lastName: string,
  dob: string,
  phone: string
) {
  const response = await fetch(
    `${NIBSS_BASE_URL}/api/insertBvn`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bvn,
        firstName,
        lastName,
        dob,
        phone,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Failed to insert test BVN"
    );
  }

  return data;
}

/**
 * Insert a test NIN into NIBSS.
 *
 * This is intended for sandbox/testing only.
 */
export async function insertNin(
  nin: string,
  firstName: string,
  lastName: string,
  dob: string
) {
  const response = await fetch(
    `${NIBSS_BASE_URL}/api/insertNin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nin,
        firstName,
        lastName,
        dob,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Failed to insert test NIN"
    );
  }

  return data;
}

/**
 * Validate BVN.
 */
export async function validateBvn(
  bvn: string
): Promise<VerificationResponse> {
  const response = await fetch(
    `${NIBSS_BASE_URL}/api/validateBvn`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bvn,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "BVN validation failed"
    );
  }

  return {
    valid: data.success === true,
    bvn: data.data?.bvn,
    firstName:
      data.data?.firstName,
    lastName:
      data.data?.lastName,
    dob:
      data.data?.dob,
  };
}

/**
 * Validate NIN.
 */
export async function validateNin(
  nin: string
): Promise<VerificationResponse> {
  const response = await fetch(
    `${NIBSS_BASE_URL}/api/validateNin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nin,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "NIN validation failed"
    );
  }

  return {
    valid: data.success === true,
    nin: data.data?.nin,
    firstName:
      data.data?.firstName,
    lastName:
      data.data?.lastName,
    dob:
      data.data?.dob,
  };
}

/**
 * Get all accounts from NIBSS.
 */
export async function getNibsAccounts() {
  const tokenResponse =
    await getNibsToken();

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/accounts`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${tokenResponse.token}`,
        "Content-Type":
          "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Failed to retrieve NIBSS accounts"
    );
  }

  return data;
}

/**
 * Perform account name enquiry.
 */
export async function nameEnquiry(
  accountNumber: string
) {
  const tokenResponse =
    await getNibsToken();

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/account/name-enquiry/${accountNumber}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${tokenResponse.token}`,
        "Content-Type":
          "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Name enquiry failed"
    );
  }

  return data;
}

/**
 * Get account balance from NIBSS.
 */
export async function getAccountBalance(
  accountNumber: string
) {
  const tokenResponse =
    await getNibsToken();

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/account/balance/${accountNumber}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${tokenResponse.token}`,
        "Content-Type":
          "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Failed to retrieve account balance"
    );
  }

  return data;
}

/**
 * Perform a transfer through NIBSS.
 */
export async function performTransfer(
  from: string,
  to: string,
  amount: number
) {
  const tokenResponse =
    await getNibsToken();

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/transfer`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${tokenResponse.token}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        amount: String(amount),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Transfer failed"
    );
  }

  return data;
}

/**
 * Get transaction status from NIBSS.
 */
export async function getTransactionStatus(
  transactionId: string
) {
  const tokenResponse =
    await getNibsToken();

  const response = await fetch(
    `${NIBSS_BASE_URL}/api/transaction/${transactionId}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${tokenResponse.token}`,
        "Content-Type":
          "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Failed to retrieve transaction status"
    );
  }

  return data;
}