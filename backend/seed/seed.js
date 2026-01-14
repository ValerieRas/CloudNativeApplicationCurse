const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const admin = await prisma.user.create({
    data: {
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@gym.com',
      role: 'ADMIN'
    }
  });

  const user1 = await prisma.user.create({
    data: {
      firstname: 'Marie',
      lastname: 'Dupont',
      email: 'marie.dupont@email.com',
      role: 'USER'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      firstname: 'Pierre',
      lastname: 'Martin',
      email: 'pierre.martin@email.com',
      role: 'USER'
    }
  });

  // Create subscriptions
  console.log('📋 Creating subscriptions...');
  const subscription1 = await prisma.subscription.create({
    data: {
      userId: user1.id,
      planType: 'PREMIUM',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      autoRenew: true,
      active: true
    }
  });

  const subscription2 = await prisma.subscription.create({
    data: {
      userId: user2.id,
      planType: 'STANDARD',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-06-01'),
      autoRenew: false,
      active: true
    }
  });

  // Create classes for the next month
  console.log('🏋️ Creating classes...');
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const class1 = await prisma.class.create({
    data: {
      title: 'Yoga Matinal',
      coach: 'Sophie Laurent',
      datetime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
      duration: 60,
      capacity: 8,
      isCancelled: false
    }
  });

  const class2 = await prisma.class.create({
    data: {
      title: 'CrossFit Intense',
      coach: 'Marc Dubois',
      datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
      duration: 45,
      capacity: 12,
      isCancelled: false
    }
  });

  const class3 = await prisma.class.create({
    data: {
      title: 'Pilates Débutant',
      coach: 'Emma Wilson',
      datetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 days
      duration: 50,
      capacity: 6,
      isCancelled: false
    }
  });

  const class4 = await prisma.class.create({
    data: {
      title: 'Zumba Party',
      coach: 'Carlos Rodriguez',
      datetime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      duration: 55,
      capacity: 10,
      isCancelled: false
    }
  });

  // Create a cancelled class for testing
  const class5 = await prisma.class.create({
    data: {
      title: 'Musculation Avancée',
      coach: 'Jean Muscle',
      datetime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 days
      duration: 90,
      capacity: 8,
      isCancelled: true // This class is cancelled
    }
  });

  // Create some past classes for no-show testing
  const pastClass1 = await prisma.class.create({
    data: {
      title: 'Cours Passé 1',
      coach: 'Past Coach',
      datetime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days
      duration: 60,
      capacity: 10,
      isCancelled: false
    }
  });

  const pastClass2 = await prisma.class.create({
    data: {
      title: 'Cours Passé 2',
      coach: 'Past Coach',
      datetime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // -5 days
      duration: 45,
      capacity: 8,
      isCancelled: false
    }
  });

  // Create bookings with various scenarios
  console.log('📅 Creating bookings...');
  
  // User1 bookings - some confirmed, some cancelled
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      classId: class1.id,
      status: 'CONFIRMED'
    }
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: user1.id,
      classId: class2.id,
      status: 'CONFIRMED'
    }
  });

  const booking3 = await prisma.booking.create({
    data: {
      userId: user1.id,
      classId: class3.id,
      status: 'CANCELLED'
    }
  });

  // User2 bookings - including no-shows
  const booking4 = await prisma.booking.create({
    data: {
      userId: user2.id,
      classId: class1.id,
      status: 'CONFIRMED'
    }
  });

  const booking5 = await prisma.booking.create({
    data: {
      userId: user2.id,
      classId: class4.id,
      status: 'CONFIRMED'
    }
  });

  // Past bookings for no-show scenario
  const booking6 = await prisma.booking.create({
    data: {
      userId: user1.id,
      classId: pastClass1.id,
      status: 'NO_SHOW' // This was a no-show
    }
  });

  const booking7 = await prisma.booking.create({
    data: {
      userId: user2.id,
      classId: pastClass1.id,
      status: 'CONFIRMED' // This user attended
    }
  });

  const booking8 = await prisma.booking.create({
    data: {
      userId: user2.id,
      classId: pastClass2.id,
      status: 'NO_SHOW' // Another no-show for user2
    }
  });

  // Fill up class3 to test "class full" scenario
  // We need to create more users to fill the class (capacity: 6)
  const extraUsers = [];
  for (let i = 0; i < 5; i++) {
    const extraUser = await prisma.user.create({
      data: {
        firstname: `User${i + 3}`,
        lastname: `Test${i + 3}`,
        email: `user${i + 3}@test.com`,
        role: 'USER'
      }
    });
    extraUsers.push(extraUser);

    // Create subscription for extra user
    await prisma.subscription.create({
      data: {
        userId: extraUser.id,
        planType: 'ETUDIANT',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-01-01'),
        autoRenew: true,
        active: true
      }
    });

    // Book the class
    await prisma.booking.create({
      data: {
        userId: extraUser.id,
        classId: class3.id,
        status: 'CONFIRMED'
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`
📊 Summary:
- Users created: ${3 + extraUsers.length} (1 admin + ${2 + extraUsers.length} users)
- Subscriptions created: ${2 + extraUsers.length}
- Classes created: ${7} (${5} future + ${2} past)
- Bookings created: ${8 + extraUsers.length}

🎯 Test scenarios included:
- Class full (Pilates Débutant)
- Cancelled class (Musculation Avancée)
- No-show bookings (past classes)
- Various booking statuses
- Different subscription plans

🚀 You can now test the API!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
