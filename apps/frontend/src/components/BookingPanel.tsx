import React, { useState, useEffect } from 'react';
import { Event, Seat, User, Booking } from '@/types';
import { createBooking, confirmBooking, cancelBooking, getCurrentUser } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  UserIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface BookingPanelProps {
  seat: Seat;
  event: Event;
  user: User;
  onBookingComplete: () => void;
  onActivity: (message: string) => void;
}

const BookingPanel: React.FC<BookingPanelProps> = ({ 
  seat, 
  event, 
  user, 
  onBookingComplete, 
  onActivity 
}) => {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'reserve' | 'payment' | 'confirmed' | 'error'>('select');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  // Timer for reservation timeout (30 seconds for demo, represents 10 minutes in real system)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'reserve' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (step === 'reserve' && timeLeft === 0) {
      handleTimeout();
    }
    return () => clearTimeout(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('🔐') || errorMessage.includes('Authentication') || errorMessage.includes('authenticate')) return 'auth';
    if (errorMessage.includes('just taken') || errorMessage.includes('taken by another user') || errorMessage.includes('taken by other users')) return 'conflict';
    if (errorMessage.includes('not available') || errorMessage.includes('no longer available') || errorMessage.includes('unavailable')) return 'unavailable';
    if (errorMessage.includes('conflict') || errorMessage.includes('race') || errorMessage.includes('faster')) return 'race-condition';
    if (errorMessage.includes('Network') || errorMessage.includes('connection') || errorMessage.includes('temporarily unavailable')) return 'network';
    if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) return 'timeout';
    if (errorMessage.includes('already have a pending booking') || errorMessage.includes('pending booking for this event')) return 'duplicate-pending';
    if (errorMessage.includes('already booked') || errorMessage.includes('already confirmed') || errorMessage.includes('Duplicate bookings are not allowed')) return 'duplicate-confirmed';
    if (errorMessage.includes('already been confirmed and paid for')) return 'already-paid';
    return 'generic';
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'auth': return '🔐';
      case 'conflict': return '😔';
      case 'unavailable': return '🚫';
      case 'race-condition': return '⚡';
      case 'network': return '🌐';
      case 'timeout': return '⏰';
      case 'duplicate-pending': return '⏳';
      case 'duplicate-confirmed': return '🎫';
      case 'already-paid': return '✅';
      default: return '❌';
    }
  };

  const getErrorTitle = (errorType: string) => {
    switch (errorType) {
      case 'auth': return 'Authentication Required';
      case 'conflict': return 'Seat No Longer Available';
      case 'unavailable': return 'Seat Unavailable';
      case 'race-condition': return 'Booking Conflict';
      case 'network': return 'Connection Problem';
      case 'timeout': return 'Request Timeout';
      case 'duplicate-pending': return 'Existing Booking Found';
      case 'duplicate-confirmed': return 'Already Booked';
      case 'already-paid': return 'Payment Already Completed';
      default: return 'Booking Error';
    }
  };

  const getErrorSuggestion = (errorType: string) => {
    switch (errorType) {
      case 'auth': return 'Please select your user again from the dropdown';
      case 'conflict': return 'Click "Refresh Seats" and choose a different available seat';
      case 'unavailable': return 'Click "Refresh Seats" to see current availability';
      case 'race-condition': return 'Someone else was faster - refresh and choose another seat';
      case 'network': return 'Check your connection and try again';
      case 'timeout': return 'Server is busy - wait a moment and retry';
      case 'duplicate-pending': return 'Complete or cancel your existing booking before making a new one';
      case 'duplicate-confirmed': return 'Check "My Bookings" to see your confirmed tickets';
      case 'already-paid': return 'This booking is already complete - check your tickets';
      default: return 'Please try again or contact support';
    }
  };

  const handleReserveSeat = async () => {
    try {
      setLoading(true);
      setError(null);
      setRetryCount(retryCount + 1);
      
      // Verify authentication
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('🔐 Please authenticate first by selecting a user');
      }

      onActivity(`🔄 ${user.name} is reserving seat ${seat.row}${seat.number}...`);
      
      const bookingResponse = await createBooking(event.id!, seat.id);
      const booking = bookingResponse.data;

      setCurrentBooking(booking);
      setStep('reserve');
      setTimeLeft(30); // 30 seconds for demo (represents 10 minutes)
      
      onActivity(`✅ Seat ${seat.row}${seat.number} reserved for ${user.name} (30s timeout)`);
      toast.success(`🎫 Seat reserved! Complete payment within 30 seconds.`, {
        duration: 4000,
        icon: '⏰'
      });
      
    } catch (error: any) {
      console.error('Reservation failed:', error);
      const errorType = getErrorType(error.message);
      setError(error.message);
      setStep('error');
      onActivity(`❌ Reservation failed for ${user.name}: ${error.message}`);
      
      // Show appropriate toast based on error type
      if (errorType === 'conflict') {
        toast.error('😔 Seat taken by another user!', { 
          duration: 6000,
          icon: '💔'
        });
      } else if (errorType === 'auth') {
        toast.error('🔐 Please select a user again', { 
          duration: 6000,
          icon: '👤'
        });
      } else if (errorType === 'race-condition') {
        toast.error('⚡ Booking conflict! Choose another seat.', { 
          duration: 6000,
          icon: '🏃‍♂️'
        });
      } else if (errorType === 'duplicate-pending') {
        toast.error('⏳ You have an existing booking! Complete it first.', { 
          duration: 8000,
          icon: '📋'
        });
      } else if (errorType === 'duplicate-confirmed') {
        toast.error('🎫 You already booked these seats!', { 
          duration: 8000,
          icon: '✅'
        });
      } else {
        toast.error(`❌ ${error.message}`, { duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentBooking) return;
    
    try {
      setLoading(true);
      setError(null);
      setStep('payment');
      
      onActivity(`💳 Processing payment for ${user.name}...`);
      
      // Simulate realistic payment processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const confirmedBooking = await confirmBooking(currentBooking.id);
      setCurrentBooking(confirmedBooking);
      setStep('confirmed');
      
      onActivity(`🎉 Payment successful! Ticket confirmed for ${user.name}`);
      toast.success('🎊 Payment successful! Your ticket is confirmed.', {
        duration: 5000,
        icon: '🎉'
      });
      
      // Auto-close after success
      setTimeout(() => {
        onBookingComplete();
        resetBooking();
      }, 3000);
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      const errorType = getErrorType(error.message);
      setError(error.message);
      setStep('error');
      onActivity(`❌ Payment failed for ${user.name}: ${error.message}`);
      
      // Show appropriate toast based on error type
      if (errorType === 'duplicate-confirmed') {
        toast.error('🎫 Payment failed: You already have tickets for these seats!', { 
          duration: 8000,
          icon: '⚠️'
        });
      } else if (errorType === 'already-paid') {
        toast.error('✅ This booking is already paid and confirmed!', { 
          duration: 8000,
          icon: '🎉'
        });
      } else {
        toast.error(`💳 Payment failed: ${error.message}`, { duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!currentBooking) return;
    
    try {
      setLoading(true);
      setError(null);
      
      onActivity(`🚫 Cancelling reservation for ${user.name}...`);
      
      await cancelBooking(currentBooking.id);
      onActivity(`✅ Reservation cancelled by ${user.name} - seat ${seat.row}${seat.number} available again`);
      toast.success('🚫 Reservation cancelled - seat is now available', { 
        icon: '↩️' 
      });
      
      onBookingComplete();
      resetBooking();
      
    } catch (error: any) {
      console.error('Cancel failed:', error);
      setError(error.message);
      onActivity(`❌ Failed to cancel reservation: ${error.message}`);
      toast.error(`❌ Failed to cancel: ${error.message}`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    onActivity(`⏰ Reservation timeout for ${user.name} - seat ${seat.row}${seat.number} available again`);
    toast.error('⏰ Reservation expired! Seat is now available for others.', {
      duration: 5000,
      icon: '💨'
    });
    onBookingComplete();
    resetBooking();
  };

  const resetBooking = () => {
    setCurrentBooking(null);
    setStep('select');
    setError(null);
    setTimeLeft(0);
    setRetryCount(0);
  };

  const retryBooking = () => {
    setError(null);
    setStep('select');
    // Don't reset retry count to track attempts
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      regular: 'bg-gray-100 text-gray-800',
      premium: 'bg-yellow-100 text-yellow-800',
      vip: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || colors.regular;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip': return '👑';
      case 'premium': return '⭐';
      case 'regular': return '👤';
      default: return '👤';
    }
  };

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case 'select': return '🎯';
      case 'reserve': return '⏰';
      case 'payment': return '💳';
      case 'confirmed': return '🎉';
      case 'error': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <div className="success-message">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="w-5 h-5" />
          <div>
            <span className="font-medium">Authenticated as:</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-semibold">{user.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTierBadge(user.tier)}`}>
                {getTierIcon(user.tier)} {user.tier.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Seat Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Selected Seat</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Seat:</span>
            <span className="font-medium">{seat.row}{seat.number}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadge(seat.type)}`}>
              {getTierIcon(seat.type)} {seat.type.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Price:</span>
            <span className="font-bold text-primary-600">${seat.price}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              seat.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {seat.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Booking for</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>User:</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Email:</span>
            <span className="text-gray-600">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span>Tier:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadge(user.tier)}`}>
              {getTierIcon(user.tier)} {user.tier.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Steps */}
      {step === 'select' && (
        <div className="space-y-4">
          <button
            onClick={handleReserveSeat}
            disabled={loading || seat.status !== 'available'}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ClockIcon className="h-4 w-4 mr-2" />
            )}
            {seat.status === 'available' ? 'Reserve Seat (30 sec hold)' : 'Seat Not Available'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Seat will be held for 30 seconds to complete payment (demo mode)
          </p>
        </div>
      )}

      {step === 'reserve' && (
        <div className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-warning-600 mr-2" />
                <span className="font-medium text-warning-800">Seat Reserved</span>
              </div>
              <div className="text-lg font-bold text-warning-800">
                {formatTime(timeLeft)}
              </div>
            </div>
            <p className="text-sm text-warning-700">
              Complete your payment within {formatTime(timeLeft)} or the reservation will expire.
            </p>
            <div className="mt-2 bg-warning-200 rounded-full h-2">
              <div 
                className="bg-warning-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CreditCardIcon className="h-4 w-4 mr-2" />
            )}
            Pay ${seat.price}
          </button>
          
          <button
            onClick={handleCancelReservation}
            disabled={loading}
            className="w-full btn-secondary"
          >
            Cancel Reservation
          </button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
              <span className="font-medium text-primary-800">Processing Payment...</span>
            </div>
            <p className="text-sm text-primary-700 text-center mt-2">
              Please wait while we process your payment
            </p>
          </div>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-success-600 mr-2" />
              <span className="font-medium text-success-800">Booking Confirmed!</span>
            </div>
            <p className="text-sm text-success-700">
              Your ticket for {event.name} has been confirmed.
            </p>
            <div className="mt-3 text-xs text-success-600">
              Booking ID: {currentBooking?.id}
            </div>
          </div>
        </div>
      )}

      {step === 'error' && error && (
        <div className="space-y-4">
          <div className="error-message">
            <div className="flex items-start space-x-3">
              <div className="text-xl">{getErrorIcon(getErrorType(error))}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">
                  {getErrorTitle(getErrorType(error))}
                </h4>
                <p className="text-sm text-red-700 mb-2">
                  {error}
                </p>
                <p className="text-xs text-red-600">
                  💡 {getErrorSuggestion(getErrorType(error))}
                </p>
                {retryCount > 1 && (
                  <div className="mt-2 text-xs text-red-500">
                    Attempt #{retryCount} - Consider trying a different seat
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={retryBooking}
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => onBookingComplete()}
              className="flex-1 btn-secondary"
            >
              Choose Another Seat
            </button>
          </div>
        </div>
      )}

      {/* Process Steps Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {getStepIcon(step)} Booking Process
        </h4>
        <div className="flex items-center space-x-2 text-xs">
          <div className={`px-2 py-1 rounded-full ${
            step === 'select' ? 'bg-blue-100 text-blue-800' : 
            ['reserve', 'payment', 'confirmed'].includes(step) ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            1. Select
          </div>
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all duration-300 ${
              ['reserve', 'payment', 'confirmed'].includes(step) ? 'w-full' : 'w-0'
            }`} />
          </div>
          <div className={`px-2 py-1 rounded-full ${
            step === 'reserve' ? 'bg-blue-100 text-blue-800' : 
            ['payment', 'confirmed'].includes(step) ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            2. Reserve
          </div>
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all duration-300 ${
              ['payment', 'confirmed'].includes(step) ? 'w-full' : 'w-0'
            }`} />
          </div>
          <div className={`px-2 py-1 rounded-full ${
            step === 'payment' ? 'bg-blue-100 text-blue-800' : 
            step === 'confirmed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            3. Pay
          </div>
          <div className="flex-1 h-0.5 bg-gray-200">
            <div className={`h-full bg-blue-500 transition-all duration-300 ${
              step === 'confirmed' ? 'w-full' : 'w-0'
            }`} />
          </div>
          <div className={`px-2 py-1 rounded-full ${
            step === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            4. Confirm
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          {step === 'select' && '🎯 Ready to reserve your seat'}
          {step === 'reserve' && '⏰ Seat reserved - complete payment quickly!'}
          {step === 'payment' && '💳 Processing your payment...'}
          {step === 'confirmed' && '🎉 Booking complete - enjoy the show!'}
          {step === 'error' && '❌ Something went wrong - please try again'}
        </div>
      </div>

      {/* Demo Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">🎭 Demo Information</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Real Authentication:</strong> Uses actual JWT tokens from login</li>
          <li>• <strong>Reservation timeout:</strong> 30 seconds (simulates 10 minutes)</li>
          <li>• <strong>Payment processing:</strong> 2 seconds (simulates real payment)</li>
          <li>• <strong>Seat conflicts:</strong> Prevented by database constraints & Kafka ordering</li>
          <li>• <strong>Multi-user testing:</strong> Open multiple tabs with different users</li>
        </ul>
      </div>

      {/* Tips for Seminar Demo */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 Seminar Demo Tips</h4>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• <strong>Concurrent booking:</strong> Have 3 users try booking same seat</li>
          <li>• <strong>Timeout demo:</strong> Reserve seat but don't pay to show timeout</li>
          <li>• <strong>Payment flow:</strong> Complete full booking process</li>
          <li>• <strong>Conflict handling:</strong> Show how system prevents double-booking</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingPanel; 