import express from "express";

import {
  onboardCustomer,
  getCustomer,
} from "../controllers/customer.controller";

const router = express.Router();

router.post("/onboard", onboardCustomer);

router.get("/:id", getCustomer);

export default router;