import express from 'express';
import Booking from '../models/Booking.js';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// GET bookings for a schedule and date (expects `?date=YYYY-MM-DD`)
router.get('/:scheduleId', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Missing date parameter' });
    }

    const bookings = await Booking.find({
      scheduleId: req.params.scheduleId,
      date: date
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel a booking
router.put('/cancel/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status === 'cancelled') {
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const schedule = await Schedule.findById(booking.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Restore seats
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

    res.json({ message: 'Booking cancelled and seat(s) restored' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings
// Expects: { name, phone, email, scheduleId, date, passengers: [...] }
router.post('/', async (req, res) => {
  const { scheduleId, name, phone, email, date, passengers } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Missing booking date' });
  }

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    for (const passenger of passengers) {
      const seat = schedule.seatMap.find(
        (s) =>
          s.seatNumber === passenger.seatNumber &&
          s.seatType === passenger.seatType
      );

      if (!seat) {
        return res.status(400).json({ message: `Seat ${passenger.seatNumber} does not exist.` });
      }

      if (seat.isBooked) {
        return res.status(400).json({ message: `Seat ${passenger.seatNumber} is already booked.` });
      }
    }

    // Update seatMap
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
        price: schedule.price[p.seatType]
      };
    });

    const booking = new Booking({
      scheduleId,
      carNumber: schedule.carNumber,
      contactInfo: { name, phone, email },
      passengers: passengerDocs,
      bookingStatus: 'confirmed',
      date
    });

    await booking.save();
    await schedule.save();

    res.status(201).json({ message: 'Booking successful', booking });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
