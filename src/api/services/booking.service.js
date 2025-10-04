// src/api/services/booking.service.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";

const createBooking = async (bookingData) => {
    const { scheduleId, name, phone, email, date, passengers } = bookingData;
    if (!date) {
        const err = new Error("Missing booking date");
        err.statusCode = 400;
        throw err;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const schedule = await Schedule.findById(scheduleId).session(session);
        if (!schedule) throw new Error("Schedule not found");

        for (const p of passengers) {
            const seat = schedule.seatMap.find(s => s.seatNumber === p.seatNumber && s.seatType === p.seatType);
            if (!seat) throw new Error(`Seat ${p.seatNumber} does not exist.`);
            if (seat.isBooked) throw new Error(`Seat ${p.seatNumber} is already booked.`);
            seat.isBooked = true;
        }
        
        schedule.seatsAvailable -= passengers.length;
        
        const passengerDocs = passengers.map(p => ({
            name: p.name || name,
            age: p.age,
            seatType: p.seatType,
            seatNumber: p.seatNumber,
            price: schedule.price[p.seatType],
        }));

        const booking = new Booking({
            scheduleId,
            carNumber: schedule.carNumber,
            contactInfo: { name, phone, email },
            passengers: passengerDocs,
            bookingStatus: "confirmed",
            date,
        });

        await booking.save({ session });
        await schedule.save({ session });
        await session.commitTransaction();
        return booking;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const getAllBookings = async () => {
    return await Booking.find().populate("scheduleId");
};

const getBookingById = async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate("scheduleId");
    if (!booking) {
        const err = new Error("Booking not found");
        err.statusCode = 404;
        throw err;
    }
    return booking;
};

const updateBooking = async (bookingId, updateData) => {
    const booking = await getBookingById(bookingId); // Reuse getById to check for existence
    const { contactInfo, passengers } = updateData;
    if (contactInfo) booking.contactInfo = contactInfo;
    if (passengers) booking.passengers = passengers;
    return await booking.save();
};

const cancelBooking = async (bookingId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking || booking.bookingStatus === "cancelled") {
            const err = new Error("Booking not found or already cancelled");
            err.statusCode = 404;
            throw err;
        }
        booking.bookingStatus = "cancelled";
        await booking.save({ session });

        const schedule = await Schedule.findById(booking.scheduleId).session(session);
        if (!schedule) throw new Error("Associated schedule not found");

        for (const p of booking.passengers) {
            const seat = schedule.seatMap.find(s => s.seatNumber === p.seatNumber && s.seatType === p.seatType);
            if (seat) {
                seat.isBooked = false;
                schedule.seatsAvailable += 1;
            }
        }
        await schedule.save({ session });
        await session.commitTransaction();
        return { message: "Booking cancelled and seat(s) restored" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const deleteBooking = async (bookingId) => {
    // This logic is very similar to cancel, could be combined if needed
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const booking = await Booking.findById(bookingId).session(session);
        if (!booking) {
             const err = new Error("Booking not found");
             err.statusCode = 404;
             throw err;
        }

        const schedule = await Schedule.findById(booking.scheduleId).session(session);
        if (schedule) {
            for (const p of booking.passengers) {
                const seat = schedule.seatMap.find(s => s.seatNumber === p.seatNumber && s.seatType === p.seatType);
                if (seat) {
                    seat.isBooked = false;
                    schedule.seatsAvailable += 1;
                }
            }
            await schedule.save({ session });
        }
        
        await Booking.findByIdAndDelete(bookingId).session(session);
        await session.commitTransaction();
        return { message: "Booking deleted and seats restored" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
};