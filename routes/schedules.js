import express from 'express'
import Schedule from '../models/Schedule.js'

const router = express.Router()

// GET all schedules (we’ll update this to support date filtering in next step)
// GET all schedules (optionally filtered by date)
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    let query = {};

    if (date) {
      const inputDate = new Date(date);
      const startOfDay = new Date(inputDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(inputDate.setHours(23, 59, 59, 999));

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const schedules = await Schedule.find(query);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })
    res.json(schedule)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST: Create a new schedule
router.post('/', async (req, res) => {
  try {
    const {
      from,
      to,
      time,
      date,
      carNumber,
      totalSeats = 6,
      price,
      seatMap
    } = req.body

    if (!date) {
      return res.status(400).json({ message: 'Date is required' })
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate)) {
      return res.status(400).json({ message: 'Invalid date format' })
    }

    // Default seat map if none provided
    const defaultSeatMap = [
      { seatNumber: "1", seatType: "front" },
      { seatNumber: "2", seatType: "rear" },
      { seatNumber: "3", seatType: "rear" },
      { seatNumber: "4", seatType: "rear" },
      { seatNumber: "5", seatType: "rear" },
      { seatNumber: "6", seatType: "rear" }
    ].map(seat => ({
      ...seat,
      isBooked: false
    }))

    const newSchedule = new Schedule({
      from,
      to,
      time,
      date: parsedDate,
      carNumber,
      totalSeats,
      seatsAvailable: totalSeats,
      price,
      seatMap: seatMap && seatMap.length === totalSeats ? seatMap : defaultSeatMap
    })

    await newSchedule.save()
    res.status(201).json(newSchedule)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET available seats for a schedule
router.get('/:id/available-seats', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' })

    const availableSeats = schedule.seatMap.filter(seat => !seat.isBooked)
    res.json(availableSeats)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
