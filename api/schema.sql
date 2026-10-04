-- MySQL Schema for Viberide

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255),
    role ENUM('renter', 'owner', 'admin') DEFAULT 'renter',
    license_front_url VARCHAR(255),
    license_back_url VARCHAR(255),
    license_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none',
    selfie_url VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_otp VARCHAR(10),
    email_otp_expires DATETIME,
    flagged BOOLEAN DEFAULT FALSE,
    suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('scooter', 'bike', 'car') NOT NULL,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    location_area VARCHAR(255) NOT NULL,
    location_city VARCHAR(255) NOT NULL,
    location_state VARCHAR(255) DEFAULT 'Himachal Pradesh',
    location_country VARCHAR(255) DEFAULT 'India',
    location_pincode VARCHAR(20),
    images JSON, -- Store array of image URLs as JSON
    owner_id INT NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    blocked_dates JSON, -- Store array of dates as JSON
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    featured BOOLEAN DEFAULT FALSE,
    flagged BOOLEAN DEFAULT FALSE,
    doc_rc_url VARCHAR(255),
    doc_insurance_url VARCHAR(255),
    spec_engine_cc INT,
    spec_fuel_type ENUM('Petrol', 'Diesel', 'Electric') DEFAULT 'Petrol',
    spec_transmission ENUM('Manual', 'Automatic', 'Geared', 'Non-Geared') DEFAULT 'Manual',
    spec_seating_capacity INT DEFAULT 2,
    spec_delivery_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlists (
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, vehicle_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    user_id INT NOT NULL,
    from_date DATETIME NOT NULL,
    to_date DATETIME NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
