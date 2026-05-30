# Vinayak Travels Backend API

Backend service powering the Vinayak Travels intercity cab ticket booking platform.

The API manages schedules, seat reservations, booking transactions, payment verification, ticket generation, and database persistence. It serves as the core business logic layer ensuring secure and consistent booking operations.

---

## Features

* Schedule management APIs
* Real-time seat availability tracking
* Seat reservation system
* Transaction-safe booking workflow
* MongoDB ACID transactions using Mongoose Sessions
* Razorpay payment gateway integration
* Server-side payment signature verification
* Booking management APIs
* Automated ticket generation
* Secure route handling
* MongoDB data persistence

---

## Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Payments

* Razorpay
* Node.js Crypto API

### Database Consistency

* MongoDB Transactions
* Mongoose Sessions

---

## System Architecture

```text
Passenger
    |
    v
React Frontend
    |
    v
Express Backend
    |
    +------ MongoDB Atlas
    |
    +------ Razorpay
```

The backend acts as the central service layer responsible for booking validation, seat allocation, payment verification, and ticket management.

---

## Core Modules

### Schedule Management

Handles route schedules, departure timings, and seat availability.

### Seat Reservation Engine

Tracks seat occupancy and validates booking requests.

### Booking Management

Creates and manages passenger bookings.

### Payment Verification

Verifies Razorpay transactions using server-side cryptographic signature validation.

### Ticket Generation

Generates booking records and ticket details after successful payment verification.

---

## Transaction-Safe Seat Booking

One of the key challenges in booking systems is preventing seat double-booking when multiple users attempt to reserve the same seat simultaneously.

To solve this, the application uses MongoDB ACID transactions through Mongoose Sessions.

### Booking Workflow

```text
User Selects Seat
        |
        v
Start MongoDB Transaction
        |
        v
Check Seat Availability
        |
        v
Reserve Seat
        |
        v
Create Booking Record
        |
        v
Commit Transaction
```

If any step fails, the transaction is rolled back automatically, ensuring database consistency and preventing duplicate seat allocations.

---

## Payment Workflow

```text
Passenger Checkout
        |
        v
Razorpay Payment Gateway
        |
        v
Payment Success Callback
        |
        v
Backend Signature Verification
        |
        v
Booking Confirmation
```

Payments are verified on the server using HMAC-SHA256 signature validation before bookings are confirmed.

---

## Security Features

* Server-side payment verification
* Transaction-safe seat allocation
* Secure environment variable configuration
* Input validation
* Protected booking workflows
* MongoDB transaction rollback support

---

## Installation

Clone the repository:

```bash
git clone https://github.com/EmulationNerds685/ErtigaCarTravel
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Start production server:

```bash
npm start
```

---

## Environment Variables

Create a `.env` file:

```env
PORT=
MONGODB_URI=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

CLIENT_URL=
```

---

## Related Repositories

### Frontend Application

Vinayak Travels Frontend

---

## Future Improvements

* Real-time seat locking
* Booking cancellation workflows
* Email ticket delivery
* Dynamic pricing engine
* Admin analytics dashboard
* Redis caching layer
* WebSocket-based seat synchronization

---

## Author

**Bhaskar Tiwari**

GitHub: https://github.com/EmulationNerds685
