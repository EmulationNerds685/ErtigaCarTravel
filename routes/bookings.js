import express from "express";
import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";

const router = express.Router();

router.get("/:scheduleId", async (req, res) => {
  console.log(req.params);
  console.log(req.query);
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Missing date parameter" });
    }

    const bookings = await Booking.find({
      scheduleId: req.params.scheduleId,
      date: date,
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/cancel/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.bookingStatus === "cancelled") {
      return res
        .status(404)
        .json({ message: "Booking not found or already cancelled" });
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    const schedule = await Schedule.findById(booking.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    for (const passenger of booking.passengers) {
      const seat = schedule.seatMap.find(
        (s) =>
          s.seatNumber === passenger.seatNumber &&
          s.seatType === passenger.seatType
      );
      if (seat) {
        seat.isBooked = false;
        schedule.seatsAvailable += 1;
      }
    }

    await schedule.save();

    res.json({ message: "Booking cancelled and seat(s) restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { scheduleId, name, phone, email, date, passengers } = req.body;

  if (!date) {
    return res.status(400).json({ message: "Missing booking date" });
  }

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    for (const passenger of passengers) {
      const seat = schedule.seatMap.find(
        (s) =>
          s.seatNumber === passenger.seatNumber &&
          s.seatType === passenger.seatType
      );

      if (!seat) {
        return res
          .status(400)
          .json({ message: `Seat ${passenger.seatNumber} does not exist.` });
      }

      if (seat.isBooked) {
        return res
          .status(400)
          .json({ message: `Seat ${passenger.seatNumber} is already booked.` });
      }
    }

    const passengerDocs = passengers.map((p) => {
      const seat = schedule.seatMap.find(
        (s) => s.seatNumber === p.seatNumber && s.seatType === p.seatType
      );

      seat.isBooked = true;
      if (schedule.seatsAvailable > 0) {
        schedule.seatsAvailable -= 1;
      }

      return {
        name: p.name || name,
        age: p.age,
        seatType: p.seatType,
        seatNumber: p.seatNumber,
        price: schedule.price[p.seatType],
      };
    });

    const booking = new Booking({
      scheduleId,
      carNumber: schedule.carNumber,
      contactInfo: { name, phone, email },
      passengers: passengerDocs,
      bookingStatus: "confirmed",
      date,
    });

    await booking.save();
    await schedule.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "scheduleId"
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { contactInfo, passengers } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (contactInfo) booking.contactInfo = contactInfo;
    if (passengers) booking.passengers = passengers;

    await booking.save();
    res.json({ message: "Booking updated successfully", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const schedule = await Schedule.findById(booking.scheduleId);
    if (schedule) {
      for (const p of booking.passengers) {
        const seat = schedule.seatMap.find(
          (s) => s.seatNumber === p.seatNumber && s.seatType === p.seatType
        );
        if (seat) {
          seat.isBooked = false;
          schedule.seatsAvailable += 1;
        }
      }
      await schedule.save();
    }

    res.json({ message: "Booking deleted and seats restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("scheduleId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
