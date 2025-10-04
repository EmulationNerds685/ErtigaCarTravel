// src/api/services/payment.service.js
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (orderData) => {
    const { scheduleId, passengers } = orderData;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
        const err = new Error("Schedule not found");
        err.statusCode = 404;
        throw err;
    }
    const totalAmount = passengers.reduce((acc, p) => acc + (schedule.price[p.seatType] || 0), 0);
    if (totalAmount <= 0) {
        const err = new Error("Invalid booking amount");
        err.statusCode = 400;
        throw err;
    }
    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_booking_${new Date().getTime()}`,
    };
    return await razorpay.orders.create(options);
};

const verifyPayment = async (paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingDetails } = paymentData;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        const err = new Error("Payment verification failed");
        err.statusCode = 400;
        throw err;
    }

    // If payment is verified, use a transaction to create the booking
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { scheduleId, passengers, contactInfo, date } = bookingDetails;
        const schedule = await Schedule.findById(scheduleId).session(session);
        if (!schedule) throw new Error("Schedule not found");

        const passengersWithPrice = passengers.map(p => ({ ...p, price: schedule.price[p.seatType] }));
        passengers.forEach(p => {
            const seat = schedule.seatMap.find(s => s.seatNumber === p.seatNumber);
            if (seat) seat.isBooked = true;
        });
        schedule.seatsAvailable -= passengers.length;
        await schedule.save({ session });

        const newBooking = new Booking({
            scheduleId, carNumber: schedule.carNumber, date, contactInfo,
            passengers: passengersWithPrice,
            bookingStatus: "confirmed",
            paymentDetails: { orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature },
        });
        await newBooking.save({ session });
        await session.commitTransaction();
        return newBooking;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const paymentService = {
  createOrder,
  verifyPayment,
};