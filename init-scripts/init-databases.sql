-- Create databases for the ticket booking system
CREATE DATABASE users_demo;
CREATE DATABASE bookings_demo;

-- Grant all privileges to postgres user (default superuser)
GRANT ALL PRIVILEGES ON DATABASE users_demo TO postgres;
GRANT ALL PRIVILEGES ON DATABASE bookings_demo TO postgres;

-- Connect to users_demo and set up schema
\c users_demo;
GRANT ALL ON SCHEMA public TO postgres;

-- Connect to bookings_demo and set up schema  
\c bookings_demo;
GRANT ALL ON SCHEMA public TO postgres; 