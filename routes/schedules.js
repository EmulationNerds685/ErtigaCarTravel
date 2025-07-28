import express from 'express';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// GET all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Create a new schedule
router.post('/', async (req, res) => {
  try {
    const {
      from,
      to,
      time,
      carNumber,
      totalSeats = 6,
      price,
      seatMap
    } = req.body;

    // Auto-generate seatMap if not provided
    const defaultSeatMap = [
      { seatNumber: "1A", seatType: "front" },
      { seatNumber: "2A", seatType: "rear" },
      { seatNumber: "2B", seatType: "rear" },
      { seatNumber: "2C", seatType: "rear" },
      { seatNumber: "3A", seatType: "rear" },
      { seatNumber: "3B", seatType: "rear" }
    ].map(seat => ({
      ...seat,
      isBooked: false
    }));

    const newSchedule = new Schedule({
      from,
      to,
      time,
      carNumber,
      totalSeats,
      seatsAvailable: totalSeats,
      price,
      seatMap: seatMap && seatMap.length === totalSeats ? seatMap : defaultSeatMap
    });

    await newSchedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET available seats for a schedule
router.get('/:id/available-seats', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const availableSeats = schedule.seatMap.filter(seat => !seat.isBooked);
    res.json(availableSeats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
