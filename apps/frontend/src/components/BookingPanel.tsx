import React, { useState } from 'react';
import { Event, Seat, User, Booking } from '@/types';
import { createBooking, confirmBooking, cancelBooking } from '@/services/api';
import toast from 'react-hot-toast';
import { CreditCardIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
  const [step, setStep] = useState<'select' | 'reserve' | 'payment' | 'confirmed'>('select');

  const handleReserveSeat = async () => {
    try {
      setLoading(true);
      onActivity(`🔄 Reserving seat ${seat.row}${seat.number} for ${user.name}...`);
      
      const booking = await createBooking({
        eventId: event.id!,
        seatId: seat.id,
        userId: user.id
      });

      setCurrentBooking(booking);
      setStep('reserve');
      onActivity(`✅ Seat ${seat.row}${seat.number} reserved for ${user.name}`);
      toast.success('Seat reserved! Complete payment within 5 minutes.');
      
      // Simulate reservation timeout (5 minutes in demo = 30 seconds)
      setTimeout(() => {
        if (step === 'reserve') {
          handleTimeout();
        }
      }, 30000);
      
    } catch (error) {
      onActivity(`❌ Failed to reserve seat: ${error}`);
      toast.error('Failed to reserve seat. It may have been taken by another user.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!currentBooking) return;
    
    try {
      setLoading(true);
      setStep('payment');
      onActivity(`💳 Processing payment for ${user.name}...`);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const confirmedBooking = await confirmBooking(currentBooking.id);
      setCurrentBooking(confirmedBooking);
      setStep('confirmed');
      onActivity(`🎉 Payment successful! Booking confirmed for ${user.name}`);
      toast.success('Payment successful! Your ticket is confirmed.');
      
      // Auto-close after success
      setTimeout(() => {
        onBookingComplete();
        resetBooking();
      }, 3000);
      
    } catch (error) {
      onActivity(`❌ Payment failed: ${error}`);
      toast.error('Payment failed. Please try again.');
      setStep('reserve');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!currentBooking) return;
    
    try {
      setLoading(true);
      onActivity(`🚫 Cancelling reservation for ${user.name}...`);
      
      await cancelBooking(currentBooking.id);
      onActivity(`✅ Reservation cancelled for ${user.name}`);
      toast.success('Reservation cancelled');
      
      onBookingComplete();
      resetBooking();
      
    } catch (error) {
      onActivity(`❌ Failed to cancel reservation: ${error}`);
      toast.error('Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    onActivity(`⏰ Reservation timeout for seat ${seat.row}${seat.number}`);
    toast.error('Reservation expired! Seat is now available again.');
    onBookingComplete();
    resetBooking();
  };

  const resetBooking = () => {
    setCurrentBooking(null);
    setStep('select');
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      regular: 'bg-gray-100 text-gray-800',
      premium: 'bg-yellow-100 text-yellow-800',
      vip: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || colors.regular;
  };

  return (
    <div className="space-y-6">
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
              {seat.type.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Price:</span>
            <span className="font-bold text-primary-600">${seat.price}</span>
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
            <span>Tier:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadge(user.tier)}`}>
              {user.tier.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Steps */}
      {step === 'select' && (
        <div className="space-y-4">
          <button
            onClick={handleReserveSeat}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <ClockIcon className="h-4 w-4 mr-2" />
            )}
            Reserve Seat (5 min hold)
          </button>
          <p className="text-xs text-gray-500 text-center">
            Seat will be held for 5 minutes to complete payment
          </p>
        </div>
      )}

      {step === 'reserve' && (
        <div className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-warning-600 mr-2" />
              <span className="font-medium text-warning-800">Seat Reserved</span>
            </div>
            <p className="text-sm text-warning-700">
              Complete your payment within 5 minutes or the reservation will expire.
            </p>
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
          </div>
        </div>
      )}

      {/* Demo Notes */}
      <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
        <h4 className="font-medium text-gray-900 mb-2">🎮 Demo Scenario</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Reservation timeout: 30 seconds (simulates 5 minutes)</li>
          <li>• Payment processing: 2 seconds (simulates real payment)</li>
          <li>• Concurrent booking conflicts are handled by Kafka message ordering</li>
          <li>• Each user tier has different access to seat types</li>
        </ul>
      </div>
    </div>
  );
};

export default BookingPanel; 