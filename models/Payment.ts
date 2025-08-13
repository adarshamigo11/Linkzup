import mongoose, { Schema, type Document } from "mongoose"

export interface IPayment extends Document {
  userId: string
  razorpayOrderId: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  amount: number
  currency: string
  status: "created" | "paid" | "failed" | "cancelled"
  planName: string
  planDuration: string
  metadata?: {
    planType?: string
    userEmail?: string
    userName?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    planName: {
      type: String,
      required: true,
    },
    planDuration: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
PaymentSchema.index({ userId: 1, status: 1 })
PaymentSchema.index({ createdAt: -1 })

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema)
