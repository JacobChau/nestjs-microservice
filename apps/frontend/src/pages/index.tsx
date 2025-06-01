import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import EventList from '@/components/EventList'
import SeatMap from '@/components/SeatMap'
import BookingPanel from '@/components/BookingPanel'
import UserSelector from '@/components/UserSelector'
import ActivityLog from '@/components/ActivityLog'
import { Event, Seat, User } from '@/types'
import { fetchEvents, fetchSeats, restoreAuthState } from '@/services/api'
import toast from 'react-hot-toast'

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<string[]>([])
  const [seatRefreshInterval, setSeatRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [conflictSeats, setConflictSeats] = useState<string[]>([]) // Track seats that just became unavailable

  const addActivity = (message: string) => {
    setActivities(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)])
  }

  // Restore authentication state on page load
  useEffect(() => {
    const restoredUser = restoreAuthState();
    if (restoredUser) {
      setCurrentUser(restoredUser);
      addActivity(`🔄 Restored session for: ${restoredUser.name} (${restoredUser.tier})`);
    }
  }, []);

  // Auto-refresh seats every 3 seconds when an event is selected for real-time updates
  const startSeatRefresh = (eventId: string) => {
    if (seatRefreshInterval) {
      clearInterval(seatRefreshInterval)
    }
    
    // Remove automatic refresh to reduce database hits
    // const interval = setInterval(() => {
    //   loadSeats(eventId, true) // Silent refresh
    // }, 3000) // Reduced to 3 seconds for better demo experience
    
    // setSeatRefreshInterval(interval)
  }

  const stopSeatRefresh = () => {
    if (seatRefreshInterval) {
      clearInterval(seatRefreshInterval)
      setSeatRefreshInterval(null)
    }
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await fetchEvents()
      setEvents(eventsData)
      addActivity('✅ Events loaded successfully')
    } catch (error) {
      toast.error('Failed to load events')
      addActivity('❌ Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const loadSeats = async (eventId: string, silent = false) => {
    try {
      if (!silent) setLoading(true)
      const seatsData = await fetchSeats(eventId)
      
      // Check for seat conflicts (seats that became unavailable)
      if (selectedSeat && seats.length > 0) {
        const oldSeat = seats.find(s => s.id === selectedSeat.id)
        const newSeat = seatsData.find(s => s.id === selectedSeat.id)
        
        if (oldSeat && newSeat && oldSeat.status === 'available' && newSeat.status !== 'available') {
          // Seat became unavailable
          setConflictSeats([selectedSeat.id])
          setSelectedSeat(null)
          
          if (!silent) {
            toast.error(`😔 Seat ${selectedSeat.row}${selectedSeat.number} was just taken by another user!`)
            addActivity(`❌ Seat ${selectedSeat.row}${selectedSeat.number} became unavailable`)
          }
          
          // Clear conflict indication after 3 seconds
          setTimeout(() => {
            setConflictSeats([])
          }, 3000)
        }
      }
      
      setSeats(seatsData)
      if (!silent) {
        addActivity(`Seats loaded for event: ${selectedEvent?.name}`)
      }
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load seats')
        addActivity('❌ Failed to load seats')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    setSelectedSeat(null)
    setConflictSeats([]) // Clear any conflict indicators
    stopSeatRefresh() // Stop previous refresh
    
    if (event.id) {
      loadSeats(event.id)
      startSeatRefresh(event.id) // Start new refresh
    }
    addActivity(`Selected event: ${event.name}`)
  }

  const handleSeatSelect = (seat: Seat) => {
    if (seat.status === 'available') {
      setSelectedSeat(seat)
      setConflictSeats([]) // Clear any conflict indicators
      addActivity(`Selected seat: ${seat.row}${seat.number} ($${seat.price})`)
    } else {
      // Provide helpful feedback for non-available seats
      if (seat.status === 'reserved') {
        if (seat.reservedBy === currentUser?.id) {
          toast('💺 This seat is reserved by you', { icon: 'ℹ️' })
        } else {
          toast.error(`⏳ This seat is reserved by another user`)
        }
      } else if (seat.status === 'booked' || seat.status === 'confirmed') {
        toast.error(`🔒 This seat is already booked`)
      } else {
        toast.error('This seat is not available')
      }
      addActivity(`❌ Attempted to select unavailable seat: ${seat.row}${seat.number} (${seat.status})`)
    }
  }

  const handleBookingComplete = () => {
    setSelectedSeat(null)
    setConflictSeats([]) // Clear any conflict indicators
    if (selectedEvent?.id) {
      loadSeats(selectedEvent.id)
    }
  }

  // Handle user selection (authentication is now handled in UserSelector)
  const handleUserChange = (user: User | null) => {
    setCurrentUser(user)
    if (user) {
      addActivity(`👤 User authenticated: ${user.name} (${user.tier})`)
    } else {
      addActivity('👤 User logged out')
    }
    // Reset seat selection when user changes
    setSelectedSeat(null)
    setConflictSeats([])
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopSeatRefresh()
    }
  }, [])

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
              <UserSelector currentUser={currentUser} onUserChange={handleUserChange} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Layout - More space for seat map and booking */}
          <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Events (Smaller on large screens) */}
            <div className="xl:col-span-1 lg:col-span-1 space-y-6">
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

            {/* Middle Column - Seat Map (Larger) */}
            <div className="xl:col-span-2 lg:col-span-1 card p-6">
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
                  currentUser={currentUser}
                  eventId={selectedEvent.id!}
                />
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-6xl mb-6">🎭</div>
                  <h3 className="text-xl font-medium mb-2">Select an Event</h3>
                  <p>Choose an event from the left to view available seats</p>
                </div>
              )}
            </div>

            {/* Right Column - Booking Panel (Larger) */}
            <div className="xl:col-span-1 lg:col-span-1 card p-6">
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
                <div className="text-center py-16 text-gray-500">
                  <div className="text-6xl mb-6">🎫</div>
                  <div className="space-y-3">
                    {!currentUser && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Select a User</h3>
                        <p className="text-sm">Choose a demo user from the header to start booking</p>
                      </div>
                    )}
                    {!selectedSeat && currentUser && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Select a Seat</h3>
                        <p className="text-sm">Click on an available seat to book it</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Enhanced Demo Controls */}
          <div className="mt-8 card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Demo Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={loadEvents}
                className="btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <span className="mr-2">🔄</span>
                )}
                Refresh Events
              </button>
              
              {selectedEvent && (
                <button 
                  onClick={() => loadSeats(selectedEvent.id!)}
                  className="btn-secondary flex items-center justify-center"
                  disabled={loading}
                >
                  <span className="mr-2">🪑</span>
                  Refresh Seats
                </button>
              )}
              
              <button 
                onClick={() => setActivities([])}
                className="btn-secondary flex items-center justify-center"
              >
                <span className="mr-2">🧹</span>
                Clear Log
              </button>
              
              {selectedEvent && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Manual refresh only
                  </div>
                </div>
              )}
            </div>
            
            {/* Demo Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Demo Instructions</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Multi-user testing:</strong> Open multiple browser tabs/windows to simulate different users</p>
                <p>• <strong>Manual updates:</strong> Click "Refresh Seats" to see latest booking status</p>
                <p>• <strong>Reservation system:</strong> Seats are held for 30 seconds (simulates 5 minutes)</p>
                <p>• <strong>User tiers:</strong> Different users have access to different seat types</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
} 