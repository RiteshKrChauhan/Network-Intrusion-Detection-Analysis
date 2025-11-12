-- Network Intrusion Detection System Database Schema
-- CICIDS-2017 Dataset Model Management

-- Create database (run separately)
-- CREATE DATABASE nids;

-- Connect to database
-- \c nids;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer'))
)

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    framework VARCHAR(50) NOT NULL,
    accuracy NUMERIC(6,4) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
    precision NUMERIC(6,4) NOT NULL CHECK (precision >= 0 AND precision <= 1),
    recall NUMERIC(6,4) NOT NULL CHECK (recall >= 0 AND recall <= 1),
    f1_score NUMERIC(6,4) NOT NULL CHECK (f1_score >= 0 AND f1_score <= 1),
    date_created DATE DEFAULT CURRENT_DATE,
    date_updated DATE
)