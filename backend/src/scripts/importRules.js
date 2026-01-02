import mongoose from "mongoose";
import csv from "csvtojson";
import dotenv from "dotenv";
import ViolationRule from "../models/ViolationRule.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const rules = await csv().fromFile("rules.csv");

  const normalizeSeverity = (value) => {
  if (!value) return "Low";
  const v = value.toLowerCase();
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  return "Low";
};

const docs = rules.map(r => ({
  violation_code: r.violation_code,
  title: r.title,
  category: r.category,
  entity_type: r.entity_type.split("|"),
  act: r.act,
  section: r.section,
  authority: r.authority,
  severity: normalizeSeverity(r.severity),
  compoundable: r.compoundable.toLowerCase() === "yes",
  description: r.description,
  keywords: [
    r.title,
    r.category,
    r.description
  ].join(" ").toLowerCase().split(/\W+/)
}));


  await ViolationRule.deleteMany({});
  await ViolationRule.insertMany(docs);

  console.log("✅ Rules imported");
  process.exit(0);
};

run();
