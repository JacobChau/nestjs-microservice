import axios from 'axios';
import { Event, Seat, User, Booking, BookingRequest } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Demo users for the seminar
export const DEMO_USERS: User[] = [
  {
    id: 'demo1',
    email: 'demo1@test.com',
    name: 'Alice (Regular)',
    tier: 'regular',
    token: 'demo1-token'
  },
  {
    id: 'demo2',
    email: 'demo2@test.com',
    name: 'Bob (Premium)',
    tier: 'premium',
    token: 'demo2-token'
  },
  {
    id: 'demo3',
    email: 'demo3@test.com',
    name: 'Carol (VIP)',
    tier: 'vip',
    token: 'demo3-token'
  },
  {
    id: 'admin',
    email: 'admin@test.com',
    name: 'Admin (VIP)',
    tier: 'vip',
    token: 'admin-token'
  }
];

// Set auth token for requests
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

export const fetchEventById = async (eventId: string): Promise<Event> => {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    throw error;
  }
};

// Seats API
export const fetchSeats = async (eventId: string): Promise<Seat[]> => {
  try {
    const response = await api.get(`/events/${eventId}/seats`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch seats:', error);
    throw error;
  }
};

// Bookings API
export const createBooking = async (bookingData: BookingRequest): Promise<Booking> => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
};

export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/confirm`);
    return response.data;
  } catch (error) {
    console.error('Failed to confirm booking:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    throw error;
  }
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    throw error;
  }
};

// Auth API
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Failed to login:', error);
    throw error;
  }
};

// Demo helper functions
export const simulateDelay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getRandomUser = (): User => {
  return DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
};

export default api; 