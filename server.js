```javascript
require("dotenv").config();

const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   MYSQL DATABASE
   ========================================================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "vehicle_rental_db",

  // Aiven requires an encrypted SSL connection.
  // Keep certificate verification enabled.
  ssl: process.env.DB_HOST
    ? { rejectUnauthorized: true }
    : undefined,

  waitForConnections: true,
  connectionLimit: 10
});

/* =========================================================
   GET VEHICLES
   ========================================================= */

app.get("/api/vehicles", async (req, res) => {
  try {
        const [rows] = await pool.query(
      "SELECT * FROM vehicles WHERE available = 1 ORDER BY id DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error("Get vehicles error:", err.message);

    res.status(500).json({
      error: "Unable to load vehicles. Check MySQL setup."
    });
  }
});

/* =========================================================
   CREATE BOOKING
   ========================================================= */

app.post("/api/bookings", async (req, res) => {
  const {
    customer_name,
    email,
    phone,
    vehicle_id,
    pickup_date,
    return_date
  } = req.body;

  if (
    !customer_name ||
    !email ||
    !phone ||
    !vehicle_id ||
    !pickup_date ||
    !return_date
  ) {
    return res.status(400).json({
      error: "Please fill all required fields."
    });
  }

  try {
    const [vehicles] = await pool.query(
      `SELECT *
       FROM vehicles
       WHERE id = ?
       AND available = 1`,
      [vehicle_id]
    );

    if (!vehicles.length) {
      return res.status(400).json({
        error: "Selected vehicle is not available."
      });
    }

    const vehicle = vehicles[0];
    const start = new Date(pickup_date);
    const end = new Date(return_date);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        error: "Invalid pickup or return date."
      });
    }

    if (end < start) {
      return res.status(400).json({
        error: "Return date must be after pickup date."
      });
    }

    const days = Math.max(
      1,
      Math.ceil((end - start) / 86400000)
    );

    const total = days * Number(vehicle.price_per_day);

    const [result] = await pool.query(
      `INSERT INTO bookings
       (
         customer_name,
         email,
         phone,
         vehicle_id,
         pickup_date,
         return_date,
         total_amount,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmed')`,
      [
        customer_name,
        email,
        phone,
        vehicle_id,
        pickup_date,
        return_date,
        total
      ]
    );

    res.status(201).json({
      message: "Booking confirmed successfully!",
      bookingId: result.insertId,
      total: total
    });
  } catch (err) {
    console.error("Create booking error:", err.message);

    res.status(500).json({
      error: "Booking failed. Check your database connection."
    });
  }
});

/* =========================================================
   GET BOOKING HISTORY
   ========================================================= */

app.get("/api/bookings", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         b.id,
         b.customer_name,
         b.email,
         b.phone,
         b.vehicle_id,
         v.name AS vehicle_name,
         v.type,
         b.pickup_date,
         b.return_date,
         b.total_amount,
         b.status
       FROM bookings b
       JOIN vehicles v ON b.vehicle_id = v.id
       ORDER BY b.id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("Booking history error:", err.message);

    res.status(500).json({
      error: "Unable to load bookings."
    });
  }
});

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      server: "online",
      database: "connected"
    });
  } catch (err) {
    console.error("Health check error:", err.message);

    res.status(500).json({
      server: "online",
      database: "disconnected"
    });
  }
});

/* =========================================================
   MAIN PAGE
   ========================================================= */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RideEase server listening on port ${PORT}`);
});
```
