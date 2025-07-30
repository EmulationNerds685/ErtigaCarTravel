// models/Schedule.js
import mongoose from 'mongoose'

const scheduleSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  carNumber: {
    type: String,
    required: true,
  },
  totalSeats: {
    type: Number,
    default: 6,
  },
  seatsAvailable: {
    type: Number,
    default: 6,
  },
  price: {
    front: { type: Number, required: true },
    rear: { type: Number, required: true }
  },
  seatMap: {
    type: [
      {
        seatNumber: String,
        isBooked: {
          type: Boolean,
          default: false,
        },
        seatType: {
          type: String,
          enum: ['front', 'rear'],
          default: 'rear',
        },
      },
    ],
    default: [],
  },
})

export default mongoose.model('Schedule', scheduleSchema)
