// MongoDB seed script for events
db = db.getSiblingDB('events_demo');

// Create demo user
db.createUser({
  user: 'demo',
  pwd: 'demo123',
  roles: [{ role: 'readWrite', db: 'events_demo' }]
});

// Sample events data
const events = [
  {
    id: 'event_1703123456789_abc123def',
    name: 'Taylor Swift - The Eras Tour',
    venue: 'Madison Square Garden',
    date: new Date('2024-06-15T20:00:00Z'),
    totalSeats: 100,
    availableSeats: 100,
    price: 150,
    description: 'Experience the magic of Taylor Swift\'s greatest hits spanning her entire career',
    category: 'Concert',
    status: 'upcoming',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'event_1703123456790_def456ghi',
    name: 'Ed Sheeran - Mathematics Tour',
    venue: 'Wembley Stadium',
    date: new Date('2024-07-20T19:30:00Z'),
    totalSeats: 80,
    availableSeats: 80,
    price: 120,
    description: 'An intimate acoustic performance by Ed Sheeran',
    category: 'Concert',
    status: 'upcoming',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'event_1703123456791_ghi789jkl',
    name: 'Local Jazz Night',
    venue: 'Blue Note Jazz Club',
    date: new Date('2024-05-25T21:00:00Z'),
    totalSeats: 50,
    availableSeats: 50,
    price: 45,
    description: 'A cozy evening with local jazz musicians',
    category: 'Jazz',
    status: 'upcoming',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert events
db.events.insertMany(events);

console.log('✅ Events seeded successfully!');
console.log(`📊 Inserted ${events.length} events`);

// Display the events
db.events.find().forEach(event => {
  console.log(`🎭 ${event.name} at ${event.venue} - ${event.totalSeats} seats - $${event.price}`);
}); 