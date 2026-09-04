# TS Academy Digital Banking System

A secure backend API for a digital banking system built with **Node.js, TypeScript, Express.js, Prisma, SQLite, JWT Authentication, and NIBSS By Phoenix APIs**.

This project was developed as part of the **TS Academy Backend Engineering Assignment**. It demonstrates customer onboarding, KYC verification, account creation, banking operations, fund transfers, transaction tracking, authentication, authorization, and customer data privacy.

---

## 🔗 Project Links

### GitHub Repository

https://github.com/DDLTECH/ts-academy-digital-banking

### Live API

https://ts-academy-digital-banking-1.onrender.com

### API Health Check

https://ts-academy-digital-banking-1.onrender.com/

The live API should return:

```json
{
  "success": true,
  "message": "TS Academy Digital Banking API is running"
}
```

---

# 🚀 Project Overview

The TS Academy Digital Banking System is a backend application designed to provide core digital banking functionalities.

The system allows customers to:

* Register using BVN or NIN
* Verify their identity through the NIBSS By Phoenix test API
* Log in securely using email and password
* Create a bank account after successful KYC verification
* Receive an initial account funding of **₦15,000**
* Check their account balance
* Perform account name enquiries
* Perform intra-bank and inter-bank transfers
* Check transaction status
* View their transaction history
* Access only their own banking information

The backend communicates with the **NIBSS By Phoenix test API** for banking and KYC-related operations.

---

# 🎯 Assignment Objectives

The project was built to satisfy the following requirements:

1. Customer onboarding using BVN or NIN
2. KYC verification through NIBSS
3. Account creation after successful verification
4. Maximum of one account per customer
5. Initial account funding of ₦15,000
6. Account balance enquiry
7. Account name enquiry
8. Intra-bank transfers
9. Inter-bank transfers
10. Transaction status enquiry
11. Transaction history
12. Customer data privacy
13. Secure authentication
14. Secure authorization
15. NIBSS API integration

---

# 🛠️ Technology Stack

| Technology           | Purpose                          |
| -------------------- | -------------------------------- |
| Node.js              | Backend runtime                  |
| TypeScript           | Type-safe development            |
| Express.js           | REST API framework               |
| Prisma               | Database ORM                     |
| SQLite               | Local database                   |
| JWT                  | Authentication and authorization |
| bcryptjs             | Password hashing                 |
| dotenv               | Environment variable management  |
| CORS                 | Cross-origin request handling    |
| NIBSS By Phoenix API | KYC and banking operations       |
| Postman              | API testing                      |

---

# 📁 Project Structure

```text
ts-academy-digital-banking/
│
├── src/
│   ├── config/
│   │   ├── nibss.ts
│   │   └── prisma.ts
│   │
│   ├── controllers/
│   │   ├── account.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── balance.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── name-enquiry.controller.ts
│   │   ├── transaction-history.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── transfer.controller.ts
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts
│   │
│   ├── routes/
│   │   ├── account.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   └── nibss.routes.ts
│   │
│   ├── services/
│   │   └── nibss.service.ts
│   │
│   ├── utils/
│   │   └── reset-test-password.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

---

# 🔐 Authentication & Authorization

The system uses **JSON Web Tokens (JWT)** to authenticate customers.

After a successful login, the API generates a JWT containing the authenticated customer's identity.

Protected endpoints require the following HTTP header:

```text
Authorization: Bearer <JWT_TOKEN>
```

The system does not rely on a customer ID supplied by the client to determine who is performing an operation.

Instead, the authenticated customer's ID is obtained directly from the JWT.

This provides protection against customers attempting to access or manipulate another customer's information.

---

# 👤 Customer Onboarding

Customers can onboard using either:

* BVN
* NIN

The supplied KYC information is validated against the NIBSS By Phoenix test environment.

A customer is only created in the local database after successful verification.

## Onboarding Requirements

The request must contain:

* Email
* Password
* KYC type
* BVN or NIN

The password must contain at least 8 characters.

The BVN/NIN must contain exactly 11 digits.

## Endpoint

```http
POST /api/customers/onboard
```

## Example Request — BVN

```json
{
  "email": "customer@example.com",
  "password": "Password123",
  "kycType": "bvn",
  "kycId": "12345678901"
}
```

## Example Request — NIN

```json
{
  "email": "customer@example.com",
  "password": "Password123",
  "kycType": "nin",
  "kycId": "12345678901"
}
```

---

# 🔑 Customer Login

Customers authenticate using their registered email address and password.

## Endpoint

```http
POST /api/auth/login
```

## Example Request

```json
{
  "email": "customer@example.com",
  "password": "Password123"
}
```

A successful login returns:

* JWT access token
* Customer ID
* Customer email
* Customer name
* Verification status

The JWT is then used to access protected endpoints.

---

# 🏦 Account Creation

A customer must successfully complete KYC verification before creating an account.

The system enforces:

* Customer must be authenticated
* Customer must be verified
* Each customer can have only one account
* Account creation is synchronized with NIBSS
* The local database stores the account information
* The account receives an initial balance of ₦15,000

## Initial Funding

Every newly created account is pre-funded with:

```text
₦15,000
```

## Endpoint

```http
POST /api/accounts/create
```

## Authentication

```text
Bearer Token Required
```

## Example Request

```json
{
  "dob": "1990-01-01"
}
```

---

# 💰 Account Balance

Customers can retrieve the balance of their own account.

The system first checks the authenticated customer's identity and verifies that the requested account belongs to that customer.

## Endpoint

```http
GET /api/accounts/balance/:accountNumber
```

## Example

```http
GET /api/accounts/balance/2073030844
```

## Authentication

```text
Bearer Token Required
```

Customers cannot use their JWT to retrieve another customer's account balance.

---

# 🔎 Account Name Enquiry

The system supports account name enquiry through the NIBSS By Phoenix API.

This allows the system to confirm the name associated with an account number before performing a transfer.

## Endpoint

```http
GET /api/accounts/name-enquiry/:accountNumber
```

## Example

```http
GET /api/accounts/name-enquiry/2074378891
```

## Example Response

```json
{
  "success": true,
  "message": "Name enquiry successful",
  "data": {
    "accountName": "John Doe",
    "accountNumber": "2074378891",
    "bankCode": "207"
  }
}
```

---

# 💸 Fund Transfers

Customers can transfer funds from their own account to another account.

The transfer process performs several validation steps before completing the transaction.

## Transfer Process

1. Authenticate the customer
2. Identify the customer from the JWT
3. Verify ownership of the sender account
4. Validate the sender account number
5. Validate the recipient account number
6. Validate the transfer amount
7. Check the sender's current balance
8. Ensure sufficient funds are available
9. Perform recipient name enquiry
10. Submit the transfer to NIBSS
11. Verify the transaction result
12. Update the local balance
13. Store the transaction in the local database

## Endpoint

```http
POST /api/accounts/transfer
```

## Authentication

```text
Bearer Token Required
```

## Example Request

```json
{
  "from": "2073030844",
  "to": "2074378891",
  "amount": 1000,
  "description": "Test transfer"
}
```

## Successful Transfer

The system returns information including:

* Transaction ID
* Local transaction reference
* Sender account
* Recipient account
* Amount
* Transaction status

---

# 💳 Balance Protection

Before a transfer is submitted, the system checks the customer's available balance.

For example, if the account contains:

```text
₦13,000
```

and the customer attempts to transfer:

```text
₦999,999,999
```

the transaction is rejected.

Example response:

```json
{
  "success": false,
  "message": "Insufficient funds",
  "data": {
    "accountNumber": "2073030844",
    "availableBalance": 13000,
    "requestedAmount": 999999999,
    "currency": "NGN"
  }
}
```

This prevents customers from initiating transfers beyond their available funds.

---

# 📜 Transaction History

Customers can view their transaction history.

## Endpoint

```http
GET /api/accounts/transactions
```

## Authentication

```text
Bearer Token Required
```

The system retrieves the customer ID directly from the JWT.

It does **not** trust a customer ID supplied through the URL or query parameters.

This ensures that:

```text
A customer can only view their own transaction history.
```

For example, adding another customer's ID to the request does not expose that customer's transactions.

---

# 🔍 Transaction Status

The system supports transaction status enquiries through NIBSS.

## Endpoint

```http
GET /api/accounts/transaction/:transactionId
```

## Example

```http
GET /api/accounts/transaction/TX1788548979812
```

## Example Response

```json
{
  "success": true,
  "message": "Transaction status retrieved successfully",
  "data": {
    "reference": "TX1788548979812",
    "senderAccount": "2073030844",
    "receiverAccount": "2074378891",
    "amount": 1000,
    "status": "SUCCESS"
  }
}
```

Possible transaction statuses include:

```text
PENDING
SUCCESS
FAILED
```

The endpoint is protected by JWT authentication and checks that the requested transaction belongs to the authenticated customer.

---

# 🔒 Security Features

Security and customer privacy were considered throughout the application.

## JWT Authentication

Protected endpoints require a valid JWT token.

## Password Hashing

Customer passwords are hashed using `bcryptjs` before being stored in the database.

Plain-text passwords are not stored.

## Account Ownership

A customer cannot initiate a transfer from another customer's account.

## Balance Protection

The system checks the customer's available balance before initiating transfers.

## Transaction Privacy

Transaction history is retrieved using the authenticated customer's ID.

## Duplicate Account Prevention

A customer cannot create multiple accounts.

## KYC Verification

Customers must successfully complete BVN or NIN verification before account creation.

## Environment Variables

Sensitive credentials such as:

* NIBSS API key
* NIBSS API secret
* JWT secret

are stored in environment variables rather than being hard-coded into the application.

---

# 🔌 NIBSS By Phoenix Integration

The backend integrates with the NIBSS By Phoenix test API.

The integration handles:

* Fintech onboarding
* API authentication
* BVN validation
* NIN validation
* Account creation
* Account retrieval
* Name enquiry
* Account balance
* Fund transfers
* Transaction status

The NIBSS API credentials are loaded from environment variables.

---

# 🔑 NIBSS Authentication Flow

The integration follows this general process:

```text
Application
     │
     ▼
NIBSS Authentication
     │
     ▼
API Token
     │
     ▼
Protected NIBSS Endpoint
     │
     ├── Account
     ├── Balance
     ├── Name Enquiry
     ├── Transfer
     └── Transaction Status
```

The backend obtains an authentication token from the NIBSS test environment before making protected banking requests.

---

# 🗄️ Database Design

The project uses **Prisma ORM with SQLite**.

The database contains three major models:

## Customer

Stores customer information including:

* ID
* Email
* Password hash
* First name
* Last name
* BVN
* NIN
* Verification status
* Creation date

## Account

Stores:

* Account ID
* Customer ID
* Account number
* Account name
* Balance
* Bank code
* Creation date

## Transaction

Stores:

* Transaction ID
* Customer ID
* Account ID
* Sender account
* Recipient account
* Recipient bank
* Amount
* Transaction type
* Reference
* Status
* Description
* Creation date

---

# 🔗 Database Relationships

The database relationships are structured as follows:

```text
Customer
   │
   ├────────── Account
   │
   └────────── Transactions
```

Each customer can have:

```text
1 Customer → 0 or 1 Account
```

and:

```text
1 Customer → Many Transactions
```

This structure makes it possible to enforce the one-account-per-customer requirement while maintaining transaction history.

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/DDLTECH/ts-academy-digital-banking.git
```

## 2. Enter the Project Directory

```bash
cd ts-academy-digital-banking
```

## 3. Install Dependencies

```bash
npm install
```

---

# 🔐 Environment Configuration

Create a `.env` file in the project root.

Example:

```env
PORT=5000

DATABASE_URL="file:./dev.db"

NIBSS_BASE_URL="https://nibssbyphoenix.onrender.com"

NIBSS_API_KEY="your_nibss_api_key"

NIBSS_API_SECRET="your_nibss_api_secret"

JWT_SECRET="your_long_random_jwt_secret"
```

**Important:** Never upload your real `.env` file or API credentials to GitHub.

The `.env` file is excluded using `.gitignore`.

---

# 🗃️ Database Setup

Run the Prisma migration:

```bash
npx prisma migrate dev
```

Generate the Prisma Client:

```bash
npx prisma generate
```

---

# ▶️ Running the Application

## Development

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

## Production Build

```bash
npm run build
```

## Production Start

```bash
npm start
```

---

# 🧪 API Testing

The backend was tested using **Postman**.

The following test scenarios were performed.

## Customer Authentication

* Successful customer login
* Invalid login protection
* JWT generation

## Account Security

* Account creation without authentication rejected
* Duplicate account creation rejected
* Account ownership verified

## Balance

* Authenticated customer can view own balance
* Customer cannot view another customer's balance

## Transfers

* Successful transfer
* Unauthorized sender account rejected
* Insufficient funds rejected
* Recipient name enquiry performed
* Transaction recorded after successful transfer

## Transaction History

* Authenticated customer can view own history
* Attempt to access another customer's history is rejected
* Customer identity is taken from JWT

## Name Enquiry

* Successful account name enquiry through NIBSS

## Transaction Status

* Successful transaction status retrieval
* Unauthorized transaction access rejected

## Code Quality

TypeScript compilation was tested using:

```bash
npx tsc --noEmit
```

The production build was also tested using:

```bash
npm run build
```

---

# 📊 Sample Test Results

During testing, a successful test transfer was performed.

```text
Sender Account:
2073030844

Recipient Account:
2074378891

Amount:
₦1,000

Status:
SUCCESS
```

The sender's balance was subsequently updated to approximately:

```text
₦13,000
```

The transaction was also recorded in the local database.

---

# 🛡️ Privacy Test

One of the important assignment requirements was ensuring that customers cannot access another customer's information.

The transaction history endpoint was tested by attempting to provide another customer's ID.

Instead of trusting a client-supplied ID, the backend uses the customer ID contained inside the authenticated JWT.

Therefore:

```text
Authenticated Customer
        │
        ▼
       JWT
        │
        ▼
Customer ID from JWT
        │
        ▼
Own Transactions Only
```

This prevents unauthorized access to another customer's transaction history.

---

# 📋 API Endpoints

| Method | Endpoint                                    | Authentication | Purpose                     |
| ------ | ------------------------------------------- | -------------- | --------------------------- |
| POST   | `/api/customers/onboard`                    | No             | Customer onboarding         |
| POST   | `/api/auth/login`                           | No             | Customer login              |
| POST   | `/api/accounts/create`                      | Yes            | Create account              |
| GET    | `/api/accounts/balance/:accountNumber`      | Yes            | Get account balance         |
| GET    | `/api/accounts/name-enquiry/:accountNumber` | No             | Account name enquiry        |
| POST   | `/api/accounts/transfer`                    | Yes            | Transfer funds              |
| GET    | `/api/accounts/transactions`                | Yes            | Get own transaction history |
| GET    | `/api/accounts/transaction/:transactionId`  | Yes            | Transaction status          |

---

# 🌐 API Base URLs

## Local Development

```text
http://localhost:5000
```

Example:

```text
http://localhost:5000/api/auth/login
```

## Production / Live API

```text
https://ts-academy-digital-banking-1.onrender.com
```

Example:

```text
https://ts-academy-digital-banking-1.onrender.com/api/auth/login
```

Health check:

```text
https://ts-academy-digital-banking-1.onrender.com/
```

---

# 🚀 Deployment

The backend has been deployed successfully using **Render**.

## Production Configuration

The deployed service uses:

```text
Runtime:
Node.js

Branch:
main

Build Command:
npm install && npx prisma generate && npm run build

Start Command:
npm start
```

The required environment variables are configured securely on the hosting platform.

The `.env` file is not uploaded to GitHub.

## Live Deployment

**Live API:**

https://ts-academy-digital-banking-1.onrender.com

**GitHub Repository:**

https://github.com/DDLTECH/ts-academy-digital-banking

---

# ⚠️ Database Note

The development version of the application uses SQLite.

SQLite is suitable for this educational assignment and local development. However, for a production banking system, a persistent production-grade database such as PostgreSQL would be recommended.

The application can also be improved to use:

* PostgreSQL
* Integer kobo-based monetary values
* Database transaction locking
* Persistent storage
* Production-grade concurrency controls

---

# 📈 Future Improvements

Although the system satisfies the assignment requirements, the following improvements could be made for a production banking environment:

* Use PostgreSQL or another production-grade database
* Store monetary values using integer kobo or a precise decimal type instead of floating-point values
* Add refresh tokens
* Add rate limiting
* Add request validation using a validation library
* Add API documentation using Swagger/OpenAPI
* Add automated unit and integration tests
* Add transaction idempotency
* Add audit logging
* Add role-based access control
* Add Docker support
* Add CI/CD pipelines
* Add monitoring and error tracking
* Add production-grade transaction locking and concurrency controls

---

# 📄 Assignment Requirement Checklist

| Requirement                   | Status      |
| ----------------------------- | ----------- |
| Customer onboarding           | ✅ Complete  |
| BVN verification              | ✅ Complete  |
| NIN verification              | ✅ Complete  |
| Customer authentication       | ✅ Complete  |
| JWT authorization             | ✅ Complete  |
| Account creation              | ✅ Complete  |
| One account per customer      | ✅ Complete  |
| ₦15,000 initial funding       | ✅ Complete  |
| Account balance               | ✅ Complete  |
| Name enquiry                  | ✅ Complete  |
| Intra-bank transfer           | ✅ Complete  |
| Inter-bank transfer           | ✅ Complete  |
| Transaction status            | ✅ Complete  |
| Transaction history           | ✅ Complete  |
| Customer transaction privacy  | ✅ Complete  |
| NIBSS API integration         | ✅ Complete  |
| Password hashing              | ✅ Complete  |
| Account ownership protection  | ✅ Complete  |
| Insufficient funds protection | ✅ Complete  |
| TypeScript compilation        | ✅ Passed    |
| Production build              | ✅ Passed    |
| GitHub repository             | ✅ Published |
| Live API deployment           | ✅ Deployed  |

---

# 👨‍💻 Author

## DDL TECH

**TS Academy Backend Engineering Assignment**

Built with:

**Node.js • TypeScript • Express.js • Prisma • SQLite • JWT • NIBSS By Phoenix APIs**

---

# 📜 License

This project was developed for educational and assessment purposes as part of the **TS Academy Backend Engineering Assignment**.
