# RideEase - Vehicle Rental System

## Technology
- HTML, CSS, JavaScript
- Node.js
- Express.js
- MySQL

## Features
1. Responsive home page
2. Vehicle fleet listing
3. Vehicle category filter
4. Online vehicle booking
5. Automatic rental price calculation
6. MySQL storage for vehicles and bookings
7. REST API for vehicles and bookings
8. Booking confirmation with booking ID

## Setup

### 1. Install Node.js
Install Node.js LTS on your computer.

### 2. Create the database
Open MySQL Workbench or MySQL command line and run all commands in `database.sql`.

### 3. Install project packages
Open Command Prompt inside this project folder:

```bash
npm install
```

### 4. Start the project

```bash
npm start
```

### 5. Open in browser

`http://localhost:3000`

## Optional MySQL configuration

If your MySQL username/password is different, set environment variables before starting:

Windows CMD:
```cmd
set DB_USER=root
set DB_PASSWORD=your_password
set DB_NAME=vehicle_rental_db
npm start
```

The default configuration assumes:
- host: localhost
- user: root
- password: empty
- database: vehicle_rental_db

## API endpoints
- GET `/api/vehicles`
- POST `/api/bookings`
- GET `/api/bookings`
- GET `/api/health`
