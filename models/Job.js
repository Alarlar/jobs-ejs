const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Pls provide company name"],
      maxlength: 50,
    },
    position: {
      type: String,
      required: [true, "Pls provide position"],
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["intervew", "declined", "pending"],
      default: "pending",
    },
    // Привязка к User модели
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Pls provide User"],
    },
  },
  // когда создан и когда изменен
  { timestamps: true },
);

module.exports = mongoose.model("Job", JobSchema);
