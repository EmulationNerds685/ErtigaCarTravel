// routes/payment.js
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config();
// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ROUTE 1: Create a Razorpay Order
router.post("/create-order", async (req, res) => {
  const { scheduleId, passengers } = req.body;

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Calculate total amount
    const totalAmount = passengers.reduce((acc, p) => {
      return acc + (schedule.price[p.seatType] || 0);
    }, 0);

    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const options = {
      amount: totalAmount * 100, // Amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_booking_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Could not create order" });
  }
});

// ROUTE 2: Verify Payment and Confirm Booking
router.post("/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingDetails,
  } = req.body;

  // 1. Verify Razorpay Signature (No changes here)
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  // 2. If signature is verified, proceed with booking
  try {
    const { scheduleId, passengers, contactInfo, date } = bookingDetails;
    const schedule = await Schedule.findById(scheduleId);

    // ... (No changes to the seat availability check)

    // --- ⬇️ THIS IS THE FIX ⬇️ ---
    // Map the incoming passengers to a new array that includes the price
    const passengersWithPrice = passengers.map((passenger) => ({
      name: passenger.name,
      age: passenger.age,
      seatType: passenger.seatType,
      seatNumber: passenger.seatNumber,
      // Get the price from the schedule based on the passenger's seat type
      price: schedule.price[passenger.seatType],
    }));
    // --- ⬆️ END OF FIX ⬆️ ---

    // Update the schedule's seatMap (No changes here)
    passengers.forEach((p) => {
      const seat = schedule.seatMap.find((s) => s.seatNumber === p.seatNumber);
      if (seat) seat.isBooked = true;
    });
    schedule.seatsAvailable -= passengers.length;
    await schedule.save();

    const newBooking = new Booking({
      scheduleId,
      carNumber: schedule.carNumber,
      date,
      contactInfo,
      passengers: passengersWithPrice, // ❗️ Use the new array with prices
      bookingStatus: "confirmed",
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      },
    });
    await newBooking.save();

    res.status(201).json({
      message: "Payment successful and booking confirmed!",
      bookingId: newBooking._id,
      newBooking,
      departureTime: "08:00",
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    res.status(500).json({ message: "Booking confirmation failed" });
  }
});
export default router;
