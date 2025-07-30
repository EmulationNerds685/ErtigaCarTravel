// routes/scheduleRoutes.js
import express from 'express';
import Schedule from '../models/Schedule.js';

const router = express.Router();

// ✨ Manual schedule generator
router.post('/generate-weekly', async (req, res) => {
  try {
    const routes = [
      { from: "Ballia", to: "Lucknow", time: "08:00", carNumber: "UP60AB1234" },
      { from: "Ballia", to: "Lucknow", time: "09:00", carNumber: "UP60AB4567" },
      { from: "Lucknow", to: "Ballia", time: "16:00", carNumber: "UP60AB1234" },
      { from: "Lucknow", to: "Ballia", time: "17:00", carNumber: "UP60AB4567" }
    ];

    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];

      for (const route of routes) {
        const exists = await Schedule.findOne({
          from: route.from,
          to: route.to,
          time: route.time,
          carNumber: route.carNumber,
          date: formattedDate,
        });

        if (!exists) {
          await Schedule.create({
            ...route,
            date: formattedDate,
            totalSeats: 6,
            seatsAvailable: 6,
            price: {
              front: 999,
              rear: 799
            },
            seatMap: [
              { seatNumber: "1", seatType: "front" },
              { seatNumber: "2", seatType: "rear" },
              { seatNumber: "3", seatType: "rear" },
              { seatNumber: "4", seatType: "rear" },
              { seatNumber: "5", seatType: "rear" },
              { seatNumber: "6", seatType: "rear" }
            ].map(seat => ({ ...seat, isBooked: false }))
          });
        }
      }
    }

    res.status(201).json({ message: "Weekly schedules generated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while generating schedules." });
  }
});

export default router;
