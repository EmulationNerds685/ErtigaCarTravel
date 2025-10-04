// src/api/services/schedule.service.js
import Schedule from "../models/Schedule.js";
import Route from "../models/Route.js";

const findSchedules = async (queryParams) => {
    const { date, from, to, time } = queryParams;
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
    return await Schedule.find(query);
};

const getScheduleById = async (scheduleId) => {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
        const err = new Error("Schedule not found");
        err.statusCode = 404;
        throw err;
    }
    return schedule;
};

const createSchedule = async (scheduleData) => {
    const { from, to, time, date, carNumber, totalSeats = 6, price, seatMap } = scheduleData;
    const newSchedule = new Schedule({
      from, to, time, date, carNumber, totalSeats, price, seatMap,
      seatsAvailable: totalSeats,
    });
    return await newSchedule.save();
};

const getAvailableSeats = async (scheduleId) => {
    const schedule = await getScheduleById(scheduleId);
    return schedule.seatMap.filter(seat => !seat.isBooked);
};

const generateWeeklySchedules = async () => {
    // In a real app, this data would come from the database, not be hardcoded
    const routes = [
      { from: "Ballia", to: "Lucknow", time: "08:00 AM", carNumber: "UP60AB1234" },
      { from: "Ballia", to: "Lucknow", time: "09:00 AM", carNumber: "UP60AB4567" },
      { from: "Lucknow", to: "Ballia", time: "05:00 PM", carNumber: "UP60AB1234" },
      { from: "Lucknow", to: "Ballia", time: "06:00 PM", carNumber: "UP60AB4567" },
    ];

    const today = new Date();
    let schedulesCreated = 0;

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toISOString().split("T")[0];

        for (const route of routes) {
            const exists = await Schedule.findOne({ ...route, date: formattedDate });
            if (!exists) {
                await Schedule.create({
                    ...route,
                    date: formattedDate,
                    totalSeats: 6,
                    seatsAvailable: 6,
                    price: { front: 999, rear: 799 },
                    seatMap: [
                        { seatNumber: "1", seatType: "front", isBooked: false },
                        { seatNumber: "2", seatType: "rear", isBooked: false },
                        { seatNumber: "3", seatType: "rear", isBooked: false },
                        { seatNumber: "4", seatType: "rear", isBooked: false },
                        { seatNumber: "5", seatType: "rear", isBooked: false },
                        { seatNumber: "6", seatType: "rear", isBooked: false },
                    ],
                });
                schedulesCreated++;
            }
        }
    }
    return { message: `Weekly schedules generated. ${schedulesCreated} new schedules created.` };
};

// ... other schedule service functions like findByDate, getByRoute, etc.

export const scheduleService = {
  findSchedules,
  getScheduleById,
  createSchedule,
  getAvailableSeats,
  generateWeeklySchedules
};