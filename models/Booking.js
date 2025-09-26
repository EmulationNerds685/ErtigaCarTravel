import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  seatType: { type: String, enum: ["front", "rear"], required: true },
  seatNumber: { type: String, required: true },
  price: { type: Number, required: true },
});

const contactInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
});

const bookingSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  carNumber: { type: String, required: true },
  date: { type: String, required: true },
  contactInfo: { type: contactInfoSchema, required: true },
  passengers: { type: [passengerSchema], required: true },
  bookingStatus: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
