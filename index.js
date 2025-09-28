import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import scheduleRoutes from "./routes/schedules.js";
import bookingRoutes from "./routes/bookings.js";
import scheduleGenerate from "./routes/scheduleRoutes.js";
import routesAPI from "./routes/routesAPI.js";
import paymentRoutes from "./routes/payment.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/scheduleRoutes", scheduleGenerate);
app.use("/api/routes", routesAPI);
app.use("/api/payment", paymentRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
