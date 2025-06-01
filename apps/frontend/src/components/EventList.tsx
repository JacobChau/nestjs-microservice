import React from 'react';
import { Event } from '@/types';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';

interface EventListProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event) => void;
  loading: boolean;
}

const EventList: React.FC<EventListProps> = ({ events, selectedEvent, onEventSelect, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TicketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => onEventSelect(event)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
            selectedEvent?.id === event.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="font-semibold text-gray-900 mb-2">{event.name}</h3>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {event.venue}
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <div className="flex items-center">
              <TicketIcon className="h-4 w-4 mr-2" />
              {event.availableSeats} / {event.totalSeats} seats available
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-primary-600">
              ${event.price}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.availableSeats > event.totalSeats * 0.3
                ? 'bg-success-100 text-success-800'
                : event.availableSeats > 0
                ? 'bg-warning-100 text-warning-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {event.availableSeats > event.totalSeats * 0.3
                ? 'Available'
                : event.availableSeats > 0
                ? 'Few left'
                : 'Sold out'
              }
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList; 