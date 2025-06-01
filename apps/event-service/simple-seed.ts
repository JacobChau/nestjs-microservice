import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

async function runSimpleSeed() {
  const uri = 'mongodb://mongo:mongo@localhost:27017/events_demo?authSource=admin';
  const client = new MongoClient(uri);

  try {
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('events_demo');
    const eventsCollection = db.collection('events');
    const seatsCollection = db.collection('seats');

    // Check if events already exist
    const existingEvents = await eventsCollection.countDocuments();
    if (existingEvents > 0) {
      console.log('Events already exist, skipping seed...');
      return;
    }

    console.log('🌱 Seeding events and seats...');

    const events = [
      {
        id: `event_${Date.now()}_${uuidv4().substring(0, 8)}`,
        name: 'Taylor Swift - The Eras Tour',
        venue: 'Madison Square Garden',
        date: new Date('2024-06-15T20:00:00Z'),
        totalSeats: 100,
        availableSeats: 100,
        price: 150,
        description: 'Experience the magic of Taylor Swift\'s greatest hits spanning her entire career',
        category: 'Concert',
        status: 'upcoming',
      },
      {
        id: `event_${Date.now() + 1}_${uuidv4().substring(0, 8)}`,
        name: 'Ed Sheeran - Mathematics Tour',
        venue: 'Wembley Stadium',
        date: new Date('2024-07-20T19:30:00Z'),
        totalSeats: 80,
        availableSeats: 80,
        price: 120,
        description: 'An intimate acoustic performance by Ed Sheeran',
        category: 'Concert',
        status: 'upcoming',
      },
      {
        id: `event_${Date.now() + 2}_${uuidv4().substring(0, 8)}`,
        name: 'Local Jazz Night',
        venue: 'Blue Note Jazz Club',
        date: new Date('2024-05-25T21:00:00Z'),
        totalSeats: 50,
        availableSeats: 50,
        price: 45,
        description: 'A cozy evening with local jazz musicians',
        category: 'Jazz',
        status: 'upcoming',
      },
      {
        id: `event_${Date.now() + 3}_${uuidv4().substring(0, 8)}`,
        name: 'Rock Festival 2024',
        venue: 'Central Park',
        date: new Date('2024-08-15T16:00:00Z'),
        totalSeats: 200,
        availableSeats: 200,
        price: 75,
        description: 'Annual rock festival featuring multiple bands',
        category: 'Festival',
        status: 'upcoming',
      },
      {
        id: `event_${Date.now() + 4}_${uuidv4().substring(0, 8)}`,
        name: 'Classical Symphony Night',
        venue: 'Carnegie Hall',
        date: new Date('2024-09-10T19:00:00Z'),
        totalSeats: 60,
        availableSeats: 60,
        price: 200,
        description: 'An evening of classical masterpieces',
        category: 'Classical',
        status: 'upcoming',
      },
    ];

    // Insert events
    const result = await eventsCollection.insertMany(events);
    console.log(`✅ Successfully seeded ${result.insertedCount} events`);

    // Create seats for each event
    let totalSeats = 0;
    for (const event of events) {
      const seats = generateSeats(event.id, event.totalSeats, event.price);
      await seatsCollection.insertMany(seats);
      totalSeats += seats.length;
      console.log(`  • Created ${seats.length} seats for ${event.name}`);
    }

    console.log(`✅ Successfully seeded ${totalSeats} seats`);
    console.log('Demo events created:');
    console.log('  • Taylor Swift - The Eras Tour (100 seats, $150)');
    console.log('  • Ed Sheeran - Mathematics Tour (80 seats, $120)');
    console.log('  • Local Jazz Night (50 seats, $45)');
    console.log('  • Rock Festival 2024 (200 seats, $75)');
    console.log('  • Classical Symphony Night (60 seats, $200)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

function generateSeats(eventId: string, totalSeats: number, basePrice: number): any[] {
  const seats = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = Math.ceil(totalSeats / rows.length);

  let seatCount = 0;
  for (let rowIndex = 0; rowIndex < rows.length && seatCount < totalSeats; rowIndex++) {
    const row = rows[rowIndex];
    
    for (let seatNumber = 1; seatNumber <= seatsPerRow && seatCount < totalSeats; seatNumber++) {
      // Determine seat type and price based on row
      let seatType = 'regular';
      let seatPrice = basePrice;
      
      if (rowIndex < 2) { // First 2 rows are VIP
        seatType = 'vip';
        seatPrice = basePrice * 1.5;
      } else if (rowIndex < 4) { // Next 2 rows are premium
        seatType = 'premium';
        seatPrice = basePrice * 1.25;
      }

      seats.push({
        id: `${eventId}_${row}${seatNumber}`,
        eventId: eventId,
        row: row,
        number: seatNumber,
        status: 'available',
        price: Math.round(seatPrice),
        type: seatType,
      });

      seatCount++;
    }
  }

  return seats;
}

runSimpleSeed(); 