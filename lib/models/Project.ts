import mongoose from "mongoose"

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["string", "number", "boolean", "null", "undefined"],
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fields: [fieldSchema],
})

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
    resources: [resourceSchema],
  },
  {
    timestamps: true,
  },
)

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema)
