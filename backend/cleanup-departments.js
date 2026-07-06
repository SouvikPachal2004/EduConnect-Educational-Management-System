const mongoose = require('mongoose');
const Department = require('./models/Department');
const { SUPPORTED_DEPARTMENTS } = require('./utils/departmentCatalog');
require('dotenv').config();

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/educonnect');
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const cleanupDepartments = async () => {
  const result = await Department.updateMany(
    { name: { $nin: SUPPORTED_DEPARTMENTS }, isActive: true },
    { isActive: false }
  );

  const departments = await Department.find({ isActive: true, name: { $in: SUPPORTED_DEPARTMENTS } }).sort({ name: 1 });

  console.log(`Deactivated ${result.modifiedCount} unsupported department(s).`);
  console.log(`Active supported departments: ${departments.length}`);
  departments.forEach((department, index) => {
    console.log(`${index + 1}. ${department.name}`);
  });
};

const main = async () => {
  try {
    await connectDB();
    await cleanupDepartments();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

main();
