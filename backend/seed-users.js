const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/auth.utils');
require('dotenv').config();

// Sample users to seed
const users = [
  {
    name: 'Anurag Ray',
    email: 'student@educonnect.com',
    password: 'student123',
    role: 'student',
    department: 'Computer Science & Engineering',
    studentId: 'STU12345'
  },
  {
    name: 'Dr. Priya Singh',
    email: 'teacher@educonnect.com',
    password: 'teacher123',
    role: 'teacher',
    department: 'Computer Science & Engineering',
    teacherId: 'TEA001'
  },
  {
    name: 'Prof. Amit Kumar',
    email: 'hod@educonnect.com',
    password: 'hod123',
    role: 'hod',
    department: 'Computer Science & Engineering',
    teacherId: 'HOD001'
  },
  {
    name: 'Mr. Rajeev Sharma',
    email: 'admin@educonnect.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administration'
  },
  {
    name: 'Dr. Suresh Iyer',
    email: 'managing@educonnect.com',
    password: 'managing123',
    role: 'managing_authority',
    department: 'Management'
  }
];

// Connect to MongoDB and seed users
async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Create users
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
        isActive: true
      });

      await user.save();
      console.log(`Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
    }

    console.log('\n✅ User seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('=================');
    users.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

// Run the seeder
seedUsers();
