export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'regular' | 'premium' | 'vip';
  token?: string;
  password?: string; // For demo users only
}

export interface Event {
  id?: string;
  name: string;
  venue: string;
  date: string | Date;
  totalSeats: number;
  availableSeats: number;
  price: number;
  description: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  number: number;
  status: 'available' | 'reserved' | 'booked' | 'confirmed';
  price: number;
  type: 'regular' | 'premium' | 'vip';
  reservedBy?: string; // User ID who reserved this seat
  bookedBy?: string;   // User ID who booked this seat
  reservedAt?: string; // When the seat was reserved
  reservedUntil?: Date; // When the reservation expires (Date object for countdown)
  expiresAt?: string;  // When the reservation expires (ISO string)
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  seatIds: string[];   // Changed from seatId to seatIds (array)
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  paymentId?: string;
}

export interface BookingRequest {
  eventId: string;
  seatIds: string[];   // Changed from seatId to seatIds (array)
  userId?: string;     // Optional, can be inferred from auth
}

export interface BookingResponse {
  booking: Booking;
  seats: Seat[];       // Changed from seat to seats (array)
  event: Event;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;      // Added error field for better error handling
} 