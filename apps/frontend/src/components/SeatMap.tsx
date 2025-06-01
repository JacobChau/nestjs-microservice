import React from 'react';
import { Seat } from '@/types';

interface SeatMapProps {
  seats: Seat[];
  selectedSeat: Seat | null;
  onSeatSelect: (seat: Seat) => void;
  loading: boolean;
}

const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeat, onSeatSelect, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading seats...</p>
      </div>
    );
  }

  if (seats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">🪑</div>
        <p>No seats available</p>
      </div>
    );
  }

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort();

  const getSeatClassName = (seat: Seat) => {
    const baseClass = 'seat';
    
    if (selectedSeat?.id === seat.id) {
      return `${baseClass} seat-selected`;
    }
    
    switch (seat.status) {
      case 'available':
        return `${baseClass} seat-available`;
      case 'reserved':
        return `${baseClass} seat-reserved`;
      case 'booked':
        return `${baseClass} seat-booked`;
      default:
        return `${baseClass} seat-available`;
    }
  };

  const getSeatTypeColor = (seatType: string) => {
    switch (seatType) {
      case 'vip':
        return 'border-purple-500';
      case 'premium':
        return 'border-yellow-500';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Stage */}
      <div className="bg-gray-800 text-white text-center py-3 rounded-lg mb-6">
        <div className="text-sm font-medium">🎭 STAGE</div>
      </div>

      {/* Seat Map */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedRows.map((row) => {
          const rowSeats = seatsByRow[row].sort((a, b) => a.number - b.number);
          
          return (
            <div key={row} className="flex items-center space-x-1">
              {/* Row label */}
              <div className="w-8 text-center font-medium text-gray-600">
                {row}
              </div>
              
              {/* Seats in row */}
              <div className="flex space-x-1">
                {rowSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => onSeatSelect(seat)}
                    disabled={seat.status !== 'available'}
                    className={`${getSeatClassName(seat)} ${getSeatTypeColor(seat.type)}`}
                    title={`Seat ${seat.row}${seat.number} - $${seat.price} (${seat.type}) - ${seat.status}`}
                  >
                    {seat.number}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="seat seat-available"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-reserved"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-booked"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-selected"></div>
            <span>Selected</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Seat Types</h5>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-purple-500 rounded"></div>
              <span>VIP</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-yellow-500 rounded"></div>
              <span>Premium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-gray-400 rounded"></div>
              <span>Regular</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap; 