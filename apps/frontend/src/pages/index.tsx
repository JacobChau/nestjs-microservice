import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import EventList from '@/components/EventList'
import SeatMap from '@/components/SeatMap'
import BookingPanel from '@/components/BookingPanel'
import UserSelector from '@/components/UserSelector'
import ActivityLog from '@/components/ActivityLog'
import { Event, Seat, User } from '@/types'
import { fetchEvents, fetchSeats } from '@/services/api'
import toast from 'react-hot-toast'

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<string[]>([])

  const addActivity = (message: string) => {
    setActivities(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)])
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await fetchEvents()
      setEvents(eventsData)
      addActivity('Events loaded successfully')
    } catch (error) {
      toast.error('Failed to load events')
      addActivity('❌ Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const loadSeats = async (eventId: string) => {
    try {
      setLoading(true)
      const seatsData = await fetchSeats(eventId)
      setSeats(seatsData)
      addActivity(`Seats loaded for event: ${selectedEvent?.name}`)
    } catch (error) {
      toast.error('Failed to load seats')
      addActivity('❌ Failed to load seats')
    } finally {
      setLoading(false)
    }
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    setSelectedSeat(null)
    if (event.id) {
      loadSeats(event.id)
    }
    addActivity(`Selected event: ${event.name}`)
  }

  const handleSeatSelect = (seat: Seat) => {
    if (seat.status === 'available') {
      setSelectedSeat(seat)
      addActivity(`Selected seat: ${seat.row}${seat.number} ($${seat.price})`)
    } else {
      toast.error('This seat is not available')
    }
  }

  const handleBookingComplete = () => {
    setSelectedSeat(null)
    if (selectedEvent?.id) {
      loadSeats(selectedEvent.id)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>Ticket Booking System - Seminar Demo</title>
        <meta name="description" content="Real-time ticket booking system demonstrating microservices and Kafka" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🎟️ Ticket Booking System</h1>
                <p className="text-sm text-gray-600">Seminar Demo - Microservices & Kafka</p>
              </div>
              <UserSelector currentUser={currentUser} onUserChange={setCurrentUser} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Events */}
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🎵 Available Events</h2>
                <EventList 
                  events={events} 
                  selectedEvent={selectedEvent}
                  onEventSelect={handleEventSelect}
                  loading={loading}
                />
              </div>

              {/* Activity Log */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Activity Log</h3>
                <ActivityLog activities={activities} />
              </div>
            </div>

            {/* Middle Column - Seat Map */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🪑 Seat Selection
                {selectedEvent && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    - {selectedEvent.name}
                  </span>
                )}
              </h2>
              
              {selectedEvent ? (
                <SeatMap 
                  seats={seats}
                  selectedSeat={selectedSeat}
                  onSeatSelect={handleSeatSelect}
                  loading={loading}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎭</div>
                  <p>Select an event to view available seats</p>
                </div>
              )}
            </div>

            {/* Right Column - Booking Panel */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💳 Booking</h2>
              
              {selectedSeat && currentUser ? (
                <BookingPanel 
                  seat={selectedSeat}
                  event={selectedEvent!}
                  user={currentUser}
                  onBookingComplete={handleBookingComplete}
                  onActivity={addActivity}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎫</div>
                  <div className="space-y-2">
                    {!currentUser && <p>Please select a user</p>}
                    {!selectedSeat && currentUser && <p>Select a seat to book</p>}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Demo Controls */}
          <div className="mt-8 card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Demo Controls</h3>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={loadEvents}
                className="btn-primary"
                disabled={loading}
              >
                🔄 Refresh Events
              </button>
              {selectedEvent && (
                <button 
                  onClick={() => loadSeats(selectedEvent.id!)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  🪑 Refresh Seats
                </button>
              )}
              <button 
                onClick={() => setActivities([])}
                className="btn-secondary"
              >
                🧹 Clear Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
} 