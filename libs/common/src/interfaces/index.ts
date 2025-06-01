// Event Management
export interface Event {
  id: string;
  name: string;
  venue: string;
  date: Date;
  totalSeats: number;
  availableSeats: number;
  price: number;
  description?: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  number: number;
  status: 'available' | 'reserved' | 'booked';
  price: number;
  type: 'regular' | 'vip' | 'premium';
}

// User Management
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  tier: 'regular' | 'premium' | 'vip';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

// Booking Management
export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  seatIds: string[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'booking_confirmed' | 'payment_success' | 'event_reminder' | 'booking_cancelled';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}

// Unified Kafka Topics - Used for both @MessagePattern and @EventPattern
export const KafkaTopics = {
  // Event Service - Request/Response Patterns
  EVENT_CREATE: 'event.create',
  EVENT_FIND_ALL: 'event.find_all',
  EVENT_FIND_ONE: 'event.find_one',
  EVENT_UPDATE: 'event.update',
  EVENT_DELETE: 'event.delete',
  
  // Seat Service - Request/Response Patterns  
  SEAT_FIND_AVAILABLE: 'seat.find_available',
  SEAT_RESERVE: 'seat.reserve',
  SEAT_RELEASE: 'seat.release',
  
  // Auth Service - Request/Response Patterns
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_VALIDATE_TOKEN: 'user.validate_token',
  USER_FIND_ONE: 'user.find_one',
  
  // Booking Service - Request/Response Patterns
  BOOKING_CREATE: 'booking.create',
  BOOKING_FIND_ALL: 'booking.find_all',
  BOOKING_FIND_ONE: 'booking.find_one',
  BOOKING_CANCEL: 'booking.cancel',
  BOOKING_CONFIRM: 'booking.confirm',
  
  // Event Publishing - Asynchronous Events
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  SEAT_RESERVED: 'seat.reserved',
  SEAT_RELEASED: 'seat.released',
  BOOKING_REQUESTED: 'booking.requested',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_FAILED: 'booking.failed',
  PAYMENT_REQUESTED: 'payment.requested',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  USER_REGISTERED: 'user.registered',
  USER_AUTHENTICATED: 'user.authenticated',
} as const;

// DTOs
export interface CreateEventDto {
  name: string;
  venue: string;
  date: Date;
  totalSeats: number;
  price: number;
  description?: string;
  category: string;
}

export interface RegisterUserDto {
  email: string;
  name: string;
  password: string;
  phone?: string;
  tier?: 'regular' | 'premium' | 'vip';
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface CreateBookingDto {
  eventId: string;
  seatIds: string[];
}

export interface ProcessPaymentDto {
  bookingId: string;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  cardToken?: string;
}

export interface SendNotificationDto {
  userId: string;
  type: 'booking_confirmed' | 'payment_success' | 'event_reminder' | 'booking_cancelled';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'push';
}

// Response DTOs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 