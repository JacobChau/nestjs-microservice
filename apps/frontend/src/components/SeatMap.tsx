import React, { useState, useEffect } from 'react';
import { Seat, User } from '@/types';
import { fetchRealtimeSeatStatus } from '@/services/api';

interface SeatMapProps {
  seats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeat: Seat | null;
  currentUser: User | null;
  eventId: string;
}

const SeatMap: React.FC<SeatMapProps> = ({ 
  seats, 
  onSeatSelect, 
  selectedSeat, 
  currentUser,
  eventId 
}) => {
  const [realtimeStatus, setRealtimeStatus] = useState<{
    available: string[];
    reserved: { seatId: string; userId: string; expiresAt: number }[];
    booked: { seatId: string; userId: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real-time seat status
  const updateRealtimeStatus = async () => {
    try {
      setLoading(true);
      const status = await fetchRealtimeSeatStatus(eventId);
      setRealtimeStatus(status);
      console.log('🔄 Seat status updated:', status);
    } catch (error) {
      console.error('Failed to fetch real-time seat status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await updateRealtimeStatus();
  };

  // Initial load and periodic updates
  useEffect(() => {
    updateRealtimeStatus();
    
    // Remove automatic refresh to reduce database hits
    // const interval = setInterval(updateRealtimeStatus, 5000);
    // return () => clearInterval(interval);
  }, [eventId]);

  // Merge seat data with real-time status
  const getEnhancedSeats = (): Seat[] => {
    if (!realtimeStatus) return seats;

    return seats.map(seat => {
      // Check if seat is reserved with details
      const reservation = realtimeStatus.reserved.find(r => r.seatId === seat.id);
      if (reservation) {
        return {
          ...seat,
          status: 'reserved' as const,
          reservedBy: reservation.userId,
          reservedUntil: new Date(reservation.expiresAt),
        };
      }

      // Check if seat is booked
      if (realtimeStatus.booked.some(b => b.seatId === seat.id)) {
        return {
          ...seat,
          status: 'booked' as const,
          bookedBy: realtimeStatus.booked.find(b => b.seatId === seat.id)?.userId,
        };
      }

      // Check if seat is available
      if (realtimeStatus.available.includes(seat.id)) {
        return {
          ...seat,
          status: 'available' as const,
        };
      }

      return seat;
    });
  };

  const enhancedSeats = getEnhancedSeats();

  const getSeatColor = (seat: Seat) => {
    if (selectedSeat?.id === seat.id) {
      return 'bg-blue-600 text-white border-blue-700'; // Selected
    }
    
    switch (seat.status) {
      case 'available':
        return seat.type === 'premium' 
          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 cursor-pointer'
          : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'reserved':
        const isMyReservation = seat.reservedBy === currentUser?.id;
        return isMyReservation
          ? 'bg-blue-100 text-blue-800 border-blue-300 cursor-pointer' // My reservation
          : 'bg-orange-100 text-orange-800 border-orange-300 cursor-not-allowed'; // Someone else's reservation
      case 'booked':
      case 'confirmed':
        const isMyBooking = seat.bookedBy === currentUser?.id;
        return isMyBooking
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 cursor-not-allowed' // My booked seat
          : 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed'; // Someone else's booked seat
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeatIcon = (seat: Seat) => {
    switch (seat.status) {
      case 'available':
        return seat.type === 'premium' ? '⭐' : '💺';
      case 'reserved':
        const isMyReservation = seat.reservedBy === currentUser?.id;
        return isMyReservation ? '🔒' : '⏰';
      case 'booked':
      case 'confirmed':
        const isMyBooking = seat.bookedBy === currentUser?.id;
        return isMyBooking ? '🎫' : '❌';
      default:
        return '💺';
    }
  };

  const getSeatTooltip = (seat: Seat) => {
    let statusText = '';
    
    switch (seat.status) {
      case 'available':
        statusText = 'Available - Click to select';
        break;
      case 'reserved':
        if (seat.reservedBy === currentUser?.id) {
          statusText = 'Reserved by you';
          if (seat.reservedUntil) {
            const timeLeft = Math.max(0, Math.floor((seat.reservedUntil.getTime() - Date.now()) / 1000));
            statusText += ` (${timeLeft}s remaining)`;
          }
        } else {
          statusText = 'Reserved by another user';
          if (seat.reservedUntil) {
            const timeLeft = Math.max(0, Math.floor((seat.reservedUntil.getTime() - Date.now()) / 1000));
            statusText += ` (${timeLeft}s remaining)`;
          }
        }
        break;
      case 'booked':
      case 'confirmed':
        if (seat.bookedBy === currentUser?.id) {
          statusText = 'Your confirmed booking';
        } else {
          statusText = 'Booked by another user';
        }
        break;
      default:
        statusText = seat.status;
    }

    return `Seat ${seat.row}${seat.number} - $${seat.price} (${seat.type}) - ${statusText}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'available') {
      onSeatSelect(seat);
    } else if (seat.status === 'reserved' && seat.reservedBy === currentUser?.id) {
      // Allow user to select their own reserved seat
      onSeatSelect(seat);
    } else if (seat.status === 'reserved' && seat.reservedBy !== currentUser?.id) {
      // Show helpful message for reserved seats
      return;
    } else if (seat.status === 'booked' || seat.status === 'confirmed') {
      // Show helpful message for booked seats
      return;
    } else {
      onSeatSelect(seat);
    }
  };

  const getSeatStats = () => {
    const stats = enhancedSeats.reduce((acc, seat) => {
      if (seat.status === 'available') acc.available++;
      else if (seat.status === 'reserved') {
        if (seat.reservedBy === currentUser?.id) {
          acc.myReservations++;
        } else {
          acc.reserved++;
        }
      }
      else if (seat.status === 'booked' || seat.status === 'confirmed') {
        if (seat.bookedBy === currentUser?.id) {
          acc.myBookings++;
        } else {
          acc.booked++;
        }
      }
      return acc;
    }, { available: 0, reserved: 0, myReservations: 0, booked: 0, myBookings: 0 });

    return stats;
  };

  const stats = getSeatStats();

  // Group seats by row
  const seatsByRow = enhancedSeats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows and seats within each row
  const sortedRows = Object.keys(seatsByRow).sort();
  sortedRows.forEach(row => {
    seatsByRow[row].sort((a, b) => a.number - b.number);
  });

  return (
    <div className="space-y-6">
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Select Your Seat</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="btn-secondary text-sm px-3 py-1 flex items-center space-x-1"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <span>🔄</span>
            )}
            <span>Refresh</span>
          </button>
          <span className="text-sm text-gray-500">
            {realtimeStatus ? 'Up to date' : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Seat Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-green-700">Available</div>
          </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.reserved}</div>
          <div className="text-orange-700">Reserved</div>
          </div>
        {stats.myReservations > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.myReservations}</div>
            <div className="text-blue-700">Your Reservations</div>
          </div>
        )}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.booked}</div>
          <div className="text-red-700">Booked</div>
        </div>
        {stats.myBookings > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.myBookings}</div>
            <div className="text-emerald-700">Your Bookings</div>
          </div>
        )}
      </div>

      {/* Stage */}
      <div className="text-center">
        <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded-lg mb-6">
          🎭 STAGE
        </div>
      </div>

      {/* Seat Map */}
      <div className="space-y-4">
        {sortedRows.map(row => (
          <div key={row} className="flex items-center justify-center space-x-2">
            {/* Row Label */}
            <div className="w-8 text-center font-semibold text-gray-700">
                {row}
              </div>
              
            {/* Seats in Row */}
            <div className="flex space-x-2">
              {seatsByRow[row].map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                  title={getSeatTooltip(seat)}
                  className={`
                    w-12 h-12 rounded-lg border-2 text-xs font-medium
                    flex items-center justify-center
                    transition-all duration-200 transform hover:scale-105
                    ${getSeatColor(seat)}
                  `}
                    disabled={
                      seat.status === 'booked' || 
                      seat.status === 'confirmed' ||
                      (seat.status === 'reserved' && seat.reservedBy !== currentUser?.id)
                    }
                  >
                  <div className="text-center">
                    <div className="text-lg">{getSeatIcon(seat)}</div>
                    <div className="text-xs">{seat.number}</div>
                  </div>
                  </button>
                ))}
              </div>
            </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 border border-green-300 rounded flex items-center justify-center">
              💺
            </div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
              ⭐
            </div>
            <span>Premium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-100 border border-orange-300 rounded flex items-center justify-center">
              ⏰
            </div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
              🔒
            </div>
            <span>Your Reservation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-emerald-100 border border-emerald-300 rounded flex items-center justify-center">
              🎫
            </div>
            <span>Your Booking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded flex items-center justify-center">
              ❌
            </div>
            <span>Booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 border border-blue-700 rounded flex items-center justify-center text-white">
              ✓
            </div>
            <span>Selected</span>
          </div>
        </div>
            </div>

      {/* Real-time Updates Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">🔄 Manual Updates</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Click "Refresh" button to get latest seat status</li>
          <li>• Reserved seats show countdown timers</li>
          <li>• Your reservations are highlighted in blue</li>
          <li>• Expired reservations automatically become available</li>
        </ul>
      </div>
    </div>
  );
};

export default SeatMap; 