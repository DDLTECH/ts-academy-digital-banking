import bcrypt from "bcryptjs";
import prisma from "../config/prisma";

async function main() {
  const email = "testcustomer@example.com";
  const newPassword = "Test@12345";

  const hashedPassword = await bcrypt.hash(
    newPassword,
    12
  );

  const customer =
    await prisma.customer.findUnique({
      where: {
        email,
      },
    });

  if (!customer) {
    console.log(
      "Customer not found:",
      email
    );
    return;
  }

  await prisma.customer.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log(
    "Password reset successfully for:",
    email
  );
}

main()
  .catch((error) => {
    console.error(
      "Password reset error:",
      error
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });