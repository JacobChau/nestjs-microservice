export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'regular' | 'premium' | 'vip';
  token?: string;
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
  status: 'available' | 'reserved' | 'booked';
  price: number;
  type: 'regular' | 'premium' | 'vip';
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  seatId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  totalAmount: number;
  createdAt: string;
  expiresAt?: string;
}

export interface BookingRequest {
  eventId: string;
  seatId: string;
  userId: string;
}

export interface BookingResponse {
  booking: Booking;
  seat: Seat;
  event: Event;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
} 