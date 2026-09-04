import express from "express";
import cors from "cors";

import nibssRoutes from "./routes/nibss.routes";
import customerRoutes from "./routes/customer.routes";
import accountRoutes from "./routes/account.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/nibss", nibssRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TS Academy Digital Banking API is running",
  });
});

export default app;