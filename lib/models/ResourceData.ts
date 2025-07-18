import mongoose from "mongoose"

const resourceDataSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

resourceDataSchema.index({ projectId: 1, resourceName: 1 })

export const ResourceData = mongoose.models.ResourceData || mongoose.model("ResourceData", resourceDataSchema)
