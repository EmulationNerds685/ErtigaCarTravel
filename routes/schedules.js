import express from "express";
import Schedule from "../models/Schedule.js";

const router = express.Router();

router.get("/by-route/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;
    e;
    const schedules = await Schedule.find({ routeId });

    res.json(schedules);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching schedules by route", error: err });
  }
});
router.get("/by-route/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const schedules = await Schedule.find({
      from: route.from,
      to: route.to,
      time: route.time,
      date: { $gte: new Date() },
    });

    res.json(schedules);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching schedules by route", error: err });
  }
});

router.get("/", async (req, res) => {
  try {
    const { date, from, to, time } = req.query;
    const query = {};

    if (date) {
      const inputDate = new Date(date);
      query.date = {
        $gte: new Date(inputDate.setHours(0, 0, 0, 0)),
        $lte: new Date(inputDate.setHours(23, 59, 59, 999)),
      };
    }

    if (from) query.from = from;
    if (to) query.to = to;
    if (time) query.time = time;

    const schedules = await Schedule.find(query);

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/", async (req, res) => {
  try {
    const {
      from,
      to,
      time,
      date,
      carNumber,
      totalSeats = 6,
      price,
      seatMap,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const defaultSeatMap = [
      { seatNumber: "1", seatType: "front" },
      { seatNumber: "2", seatType: "rear" },
      { seatNumber: "3", seatType: "rear" },
      { seatNumber: "4", seatType: "rear" },
      { seatNumber: "5", seatType: "rear" },
      { seatNumber: "6", seatType: "rear" },
    ].map((seat) => ({
      ...seat,
      isBooked: false,
    }));

    const newSchedule = new Schedule({
      from,
      to,
      time,
      date: parsedDate,
      carNumber,
      totalSeats,
      seatsAvailable: totalSeats,
      price,
      seatMap:
        seatMap && seatMap.length === totalSeats ? seatMap : defaultSeatMap,
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/available-seats", async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    const availableSeats = schedule.seatMap.filter((seat) => !seat.isBooked);
    res.json(availableSeats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
