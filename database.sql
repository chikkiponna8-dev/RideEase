CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    seats INT NOT NULL,
    fuel VARCHAR(30) NOT NULL,
    transmission VARCHAR(30) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    available TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_id INT NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

INSERT INTO vehicles
(name, type, brand, seats, fuel, transmission, price_per_day, image, available)
VALUES
('Swift', 'Hatchback', 'Maruti Suzuki', 5, 'Petrol', 'Manual', 1200, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80', 1),
('City', 'Sedan', 'Honda', 5, 'Petrol', 'Automatic', 1800, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80', 1),
('Creta', 'SUV', 'Hyundai', 5, 'Diesel', 'Automatic', 2400, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80', 1),
('Innova Crysta', 'MUV', 'Toyota', 7, 'Diesel', 'Automatic', 3200, 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=80', 1),
('Royal Enfield Classic', 'Bike', 'Royal Enfield', 2, 'Petrol', 'Manual', 900, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80', 1),
('Activa 6G', 'Scooter', 'Honda', 2, 'Petrol', 'Automatic', 600, 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=900&q=80', 1);