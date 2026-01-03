import express from "express";
import ViolationRule from "../models/ViolationRule.js";

const router = express.Router();

// GET all rules
router.get("/", async (req, res) => {
  try {
    const rules = await ViolationRule.find().sort({ category: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
