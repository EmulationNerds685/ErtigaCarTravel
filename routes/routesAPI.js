import express from "express";
import Route from "../models/Route.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const routes = await Route.find();

    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const { from, to, time, carNumber } = req.body;

    if (!from || !to || !time || !carNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newRoute = new Route({ from, to, time, carNumber });
    const savedRoute = await newRoute.save();

    res.status(201).json(savedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error creating route", error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (error) {
    res.status(500).json({ message: "Error fetching route", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRoute)
      return res.status(404).json({ message: "Route not found" });
    res.json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute)
      return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error });
  }
});

export default router;
