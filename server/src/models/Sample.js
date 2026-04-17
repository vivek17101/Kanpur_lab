const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      default: "",
      trim: true,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
    referenceValue: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
  },
  { _id: false }
);

const sampleSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    CO: {
      type: String,
      default: "",
      trim: true,
    },
    sampleReference: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfSeal: {
      type: Date,
    },
    dateReceived: {
      type: Date,
      required: true,
    },
    dateOfTest: {
      type: Date,
    },
    tests: {
      type: [testSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Pending", "Tested", "Reported"],
      default: "Pending",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

module.exports = mongoose.model("Sample", sampleSchema);
