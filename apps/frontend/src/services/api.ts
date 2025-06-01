import axios from 'axios';
import { Event, Seat, User, Booking, BookingRequest, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Demo users for the seminar (with real credentials)
export const DEMO_USERS = [
  {
    id: 'demo1',
    email: 'demo1@test.com',
    name: 'Alice (Regular)',
    tier: 'regular' as const,
    password: 'demo123'
  },
  {
    id: 'demo2',
    email: 'demo2@test.com',
    name: 'Bob (Premium)', 
    tier: 'premium' as const,
    password: 'demo123'
  },
  {
    id: 'demo3',
    email: 'demo3@test.com',
    name: 'Carol (VIP)',
    tier: 'vip' as const,
    password: 'demo123'
  },
  {
    id: 'admin',
    email: 'admin@test.com',
    name: 'Admin (VIP)',
    tier: 'vip' as const,
    password: 'admin123'
  }
];

// Current authenticated user (per-tab)
let currentAuthenticatedUser: User | null = null;

// Set auth token for requests (store in sessionStorage for per-tab isolation)
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  sessionStorage.setItem('authToken', token); // Use sessionStorage for per-tab storage
};

// Get auth token
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

// Clear auth token
export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
  sessionStorage.removeItem('authToken');
  currentAuthenticatedUser = null;
};

// Login and get real JWT token
export const authenticateUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Authenticating user:', email);
    const response = await api.post('/auth/login', { email, password });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    const authData = response.data.data;
    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.name,
      tier: authData.user.tier,
      token: authData.token
    };

    // Set the token for future requests and store in sessionStorage
    setAuthToken(authData.token);
    setCurrentUser(user);
    currentAuthenticatedUser = user;
    
    console.log('✅ Authentication successful for:', user.name);
    return user;
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Authentication failed');
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Get current authentication status
export const getAuthStatus = (): { isAuth: boolean; user: User | null; token: string | null } => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return {
    isAuth: !!(token && user),
    user,
    token
  };
};

// Restore authentication state on page load
export const restoreAuthState = (): User | null => {
  const token = getAuthToken();
  const userJson = sessionStorage.getItem('currentUser');
  
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      setAuthToken(token);
      currentAuthenticatedUser = user;
      console.log('🔄 Restored auth state for:', user.name);
      return user;
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      clearAuthToken();
      clearCurrentUser();
    }
  }
  return null;
};

// Auto-authenticate demo user
export const authenticateDemoUser = async (demoUser: typeof DEMO_USERS[0]): Promise<User> => {
  return await authenticateUser(demoUser.email, demoUser.password);
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (currentAuthenticatedUser) {
    return currentAuthenticatedUser;
  }
  
  // Try to restore from sessionStorage
  const userJson = sessionStorage.getItem('currentUser');
  if (userJson) {
    try {
      currentAuthenticatedUser = JSON.parse(userJson);
      return currentAuthenticatedUser;
    } catch (error) {
      console.error('Failed to parse user from sessionStorage:', error);
      sessionStorage.removeItem('currentUser');
    }
  }
  
  return null;
};

// Events API
export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const response = await api.get('/events');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

export const fetchEvent = async (id: string): Promise<Event> => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    throw error;
  }
};

export const createEvent = async (eventData: Partial<Event>): Promise<Event> => {
  try {
    const response = await api.post('/events', eventData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to create event');
    }
  } catch (error: any) {
    console.error('Failed to create event:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create event');
  }
};

// Seats API
export const fetchSeats = async (eventId: string): Promise<Seat[]> => {
  try {
    const response = await api.get(`/events/${eventId}/seats`);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch seats:', error);
    throw error;
  }
};

// New: Real-time seat status API
export const fetchRealtimeSeatStatus = async (eventId: string): Promise<{
  available: string[];
  reserved: { seatId: string; userId: string; expiresAt: number }[];
  booked: { seatId: string; userId: string }[];
}> => {
  try {
    const response = await api.get(`/events/${eventId}/seats/realtime`);
    return response.data.data || { available: [], reserved: [], booked: [] };
  } catch (error) {
    console.error('Failed to fetch real-time seat status:', error);
    throw error;
  }
};

// Bookings API
export const createBooking = async (eventId: string, seatId: string): Promise<{ data: Booking }> => {
  try {
    const response = await api.post('/bookings', {
      eventId,
      seatIds: [seatId]
    });
    
    if (response.data.success) {
      return { data: response.data.data };
    } else {
      throw new Error(response.data.error || 'Booking failed');
    }
  } catch (error: any) {
    console.error('Booking failed:', error);
    
    // Enhanced error handling for different types of booking failures
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status === 409) {
      throw new Error('😔 Seat is already taken by another user');
    } else if (error.response?.status === 400) {
      throw new Error('🚫 Invalid booking request');
    } else if (error.response?.status === 401) {
      throw new Error('🔐 Please authenticate first');
    } else if (error.response?.status === 503) {
      throw new Error('🌐 Booking service temporarily unavailable');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('⏰ Request timeout - please try again');
    } else {
      throw new Error(error.message || '❌ Booking failed - please try again');
    }
  }
};

export const confirmBooking = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await api.put(`/bookings/${bookingId}/confirm`, {
      paymentId: `payment_${Date.now()}_demo`
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Payment confirmation failed');
    }
  } catch (error: any) {
    console.error('Payment confirmation failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Payment confirmation failed');
  }
};

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  try {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Cancellation failed');
    }
  } catch (error: any) {
    console.error('Cancellation failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Cancellation failed');
  }
};

export const fetchUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await api.get('/bookings');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    throw error;
  }
};

// New: Extend booking time API
export const extendBookingTime = async (bookingId: string, additionalSeconds: number = 30): Promise<boolean> => {
  try {
    const response = await api.put(`/bookings/${bookingId}/extend`, {
      additionalSeconds
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to extend booking time');
    }
  } catch (error: any) {
    console.error('Failed to extend booking time:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to extend booking time');
  }
};

// User management
export const setCurrentUser = (user: User): void => {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
};

export const clearCurrentUser = (): void => {
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('authToken');
};

// Auth API
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Login failed');
    }
  } catch (error: any) {
    console.error('Login failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Login failed');
  }
};

export const validateToken = async (token: string): Promise<User> => {
  try {
    const response = await api.post('/auth/validate', { token });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Token validation failed');
    }
  } catch (error: any) {
    console.error('Token validation failed:', error);
    throw new Error(error.response?.data?.error || error.message || 'Token validation failed');
  }
};

// Demo helper functions
export const simulateDelay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getRandomUser = () => {
  return DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
};

export default api; 