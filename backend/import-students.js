const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/auth.utils');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Student data from the Excel file
const students = [
  { name: "Abhishek kumar singh", email: "abhisheksingh27493@gmail.com", roll_number: "1", role: "Student", department: "CS-DS" },
  { name: "ABHISHEK KUMAR", email: "kanup8137@gmail.com", roll_number: "2", role: "Student", department: "CSE" },
  { name: "ABU HUZAIFA LUQMANI", email: "huzaifaluqmani13@gmail.com", roll_number: "3", role: "Student", department: "IT" },
  { name: "Sahil Kumar", email: "sahilkr2026@gmail.com", roll_number: "4", role: "Student", department: "IT" },
  { name: "Biswarup Chatterjee", email: "biswarup0304@gmail.com", roll_number: "5", role: "Student", department: "CSE" },
  { name: "Aman Kumar", email: "amankumar620507@gmai.com", roll_number: "6", role: "Student", department: "CSE" },
  { name: "Nandini Singh", email: "nandini898singh@gmail.com", roll_number: "7", role: "Student", department: "CS-DS" },
  { name: "MONAMI RANA", email: "monamirana03@gmail.com", roll_number: "8", role: "Student", department: "IT" },
  { name: "MOJAMMIL ANSARI", email: "mojammilansari820@gmail.com", roll_number: "9", role: "Student", department: "IT" },
  { name: "Labanya Saha", email: "labanyasaha2004@gmail.com", roll_number: "10", role: "Student", department: "CSE-AIML" },
  { name: "Kushal Biswas", email: "kushalb056@gmail.com", roll_number: "11", role: "Student", department: "CS-DS" },
  { name: "KUMAR MRIDUL", email: "kummridul03@gmail.com", roll_number: "12", role: "Student", department: "CSE" },
  { name: "Koyena Dutta", email: "koyenadutta394@gmail.com", roll_number: "13", role: "Student", department: "CSE-AIML" },
  { name: "Joydeep Das", email: "joydeepnjr@gmail.com", roll_number: "14", role: "Student", department: "CSE" },
  { name: "Dipanwita Pal", email: "dipanwitapal468@gmail.com", roll_number: "15", role: "Student", department: "CSE" },
  { name: "Dipannita Mukherjee", email: "mukherjeedipannita025@gmail.com", roll_number: "16", role: "Student", department: "CS-DS" },
  { name: "Chandika Sarkar", email: "chandikasarkar5@gmail.com", roll_number: "18", role: "Student", department: "IT" },
  { name: "Priyanshu Virendra", email: "priyanshuvirendra.csds@gmail.com", roll_number: "19", role: "Student", department: "CS-DS" },
  { name: "Ayana Baidya", email: "ayanabaidya4204@gmail.com", roll_number: "20", role: "Student", department: "CSE" },
  { name: "Asmita Das", email: "asmitababandas@gmail.com", roll_number: "21", role: "Student", department: "CS-DS" },
  { name: "Arpan Pan", email: "arpanpan851@gmail.com", roll_number: "22", role: "Student", department: "CSE-AIML" },
  { name: "ARNAB GUPTA", email: "arnabgupta983@gmail.com", roll_number: "23", role: "Student", department: "CS-DS" },
  { name: "Arkadeep Pathak", email: "pathakarkadeep@gmail.com", roll_number: "24", role: "Student", department: "CSE-AIML" },
  { name: "Arijit Ghosh", email: "arijitsghnia@gmail.com", roll_number: "25", role: "Student", department: "IT" },
  { name: "RISHU MODI", email: "rishumodi108@gmail.com", roll_number: "26", role: "Student", department: "CS-DS" },
  { name: "Anushka Singh", email: "anushka.singh0288@gmail.com", roll_number: "27", role: "Student", department: "IT" },
  { name: "Aditya Raj", email: "aditya055raj@gmail.com", roll_number: "28", role: "Student", department: "CS-DS" },
  { name: "Ankit  Kumar Gupta", email: "ankitkumargupta030204@gmail.com", roll_number: "29", role: "Student", department: "CSE" },
  { name: "ANANGSHA MITRA", email: "mitraanangsha@gmail.com", roll_number: "30", role: "Student", department: "IT" },
  { name: "Amrit Pramanik", email: "pramanikamrit778@gmail.com", roll_number: "31", role: "Student", department: "CSE-AIML" },
  { name: "Dayyanul Haque", email: "dayyanulhaque81@gmail.com", roll_number: "32", role: "Student", department: "IT" },
  { name: "SOUMYAJIT JANA", email: "soumyajitjana11@gmail.com", roll_number: "33", role: "Student", department: "CS-DS" },
  { name: "PUKAR SHARMA", email: "pukar.sharma00000@gmail.com", roll_number: "34", role: "Student", department: "CS-DS" },
  { name: "KARUNYA RAJ", email: "karunyaraj31@gmail.com", roll_number: "35", role: "Student", department: "CS-DS" },
  { name: "ABHISHEK SAHA", email: "abhisheksaha7908@gmail.com", roll_number: "36", role: "Student", department: "CS-DS" },
  { name: "SUPRAKASH ROY", email: "suprakash.03roy@gmail.com", roll_number: "37", role: "Student", department: "IT" },
  { name: "SUMIT DUBEY", email: "sumitkgp927@gmail.com", roll_number: "38", role: "Student", department: "CSE-AIML" },
  { name: "Suhani Kundu", email: "suhani.kundu2406@gmail.com", roll_number: "39", role: "Student", department: "CSE" },
  { name: "Srijan Paul", email: "iampaulsrijan@gmail.com", roll_number: "40", role: "Student", department: "CS-DS" },
  { name: "SRIJAN DAS", email: "dassrijan76@gmail.com", roll_number: "41", role: "Student", department: "IT" },
  { name: "SRIJAN BHATTACHARYYA", email: "srijan.76448@gmail.com", roll_number: "42", role: "Student", department: "CS-DS" },
  { name: "SOUVIK PACHAL", email: "souvikpachal2004@gmail.com", roll_number: "43", role: "Student", department: "IT" },
  { name: "SOUVIK DUTTA", email: "duttasouvik0121@gmail.com", roll_number: "44", role: "Student", department: "CSE-AIML" },
  { name: "NILESH CHOUDHURY", email: "nilesh.choudhury01@gmail.com", roll_number: "45", role: "Student", department: "CS-DS" },
  { name: "Sourasish Chatterjee", email: "rijuchatterjee772@gmail.com", roll_number: "46", role: "Student", department: "CSE" },
  { name: "ANURAG CHOWDHURY", email: "anuragchowdhury0603@gmail.com", roll_number: "47", role: "Student", department: "CSE" },
  { name: "SOUMEN GORAI", email: "soumengorai845@gmail.com", roll_number: "48", role: "Student", department: "CSE-AIML" },
  { name: "SOUJANYA KHAN", email: "soujanyakhan0@gmail.com", roll_number: "49", role: "Student", department: "CSE" },
  { name: "SOHAN SAMANTA", email: "sohansamanta18@gmail.com", roll_number: "50", role: "Student", department: "IT" },
  { name: "SHRUTI KUMARI", email: "shrutik2051@gmail.com", roll_number: "51", role: "Student", department: "CS-DS" },
  { name: "SAYAN MANNA", email: "mannasayan575@gmail.com", roll_number: "52", role: "Student", department: "CSE" },
  { name: "SANCHARI ROY", email: "roymegha454@gmail.com", roll_number: "53", role: "Student", department: "CS-DS" },
  { name: "SAHELI MAJUMDER", email: "tuli.25.26.02@gmail.com", roll_number: "54", role: "Student", department: "IT" },
  { name: "RISHI BURNWAL", email: "burnwalrishi09@gmail.com", roll_number: "55", role: "Student", department: "CSE" },
  { name: "Rhitwika Poddar", email: "rhitwikapoddar@gmail.com", roll_number: "56", role: "Student", department: "IT" },
  { name: "Ravi Ranjan Kumar", email: "raviranjan848484@gmail.com", roll_number: "57", role: "Student", department: "IT" },
  { name: "Rahul Ghosh", email: "ghoshrahul1298@gmail.com", roll_number: "58", role: "Student", department: "CS-DS" },
  { name: "RAGINI SHAW", email: "raginishaw0607@gmail.com", roll_number: "59", role: "Student", department: "IT" },
  { name: "SOURAV OJHA", email: "souravojha241@gmail.com", roll_number: "60", role: "Student", department: "CSE-AIML" },
  { name: "ANWESA MAJI", email: "anwesamaji2003@gmail.com", roll_number: "61", role: "Student", department: "CSE-AIML" },
  { name: "Aditya Verma", email: "adityaverma20111@gmail.com", roll_number: "62", role: "Student", department: "CSE" },
  { name: "ADITYA SINGH", email: "aditya28092003@gmail.com", roll_number: "63", role: "Student", department: "IT" },
  { name: "ARIN KARMAKAR", email: "arinkarmakar3@gmail.com", roll_number: "64", role: "Student", department: "CSE" },
  { name: "CHANDAN KUMAR RAJ", email: "ckr11042004@gmail.com", roll_number: "65", role: "Student", department: "CSE-AIML" },
  { name: "ROHAN MANDAL", email: "rohan.mandal200312@gmail.com", roll_number: "66", role: "Student", department: "CSE-AIML" },
  { name: "SAIKAT DAS", email: "sd449420@gmail.com", roll_number: "67", role: "Student", department: "CS-DS" },
  { name: "SUMIT KUMAR", email: "okaysumit07@gmail.com", roll_number: "68", role: "Student", department: "IT" }
];

// Import students
const importStudents = async () => {
  try {
    await connectDB();
    
    // Clear existing students if needed (optional)
    // await User.deleteMany({ role: 'student' });
    
    // Process each student
    for (const student of students) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: student.email });
        if (existingUser) {
          console.log(`User with email ${student.email} already exists. Skipping...`);
          continue;
        }
        
        // Hash the default password
        const hashedPassword = await hashPassword("12345678");
        
        // Create user object
        const user = new User({
          name: student.name,
          email: student.email,
          password: hashedPassword,
          role: 'student', // Convert role to lowercase
          department: student.department,
          studentId: student.roll_number // Using roll_number as studentId
        });
        
        await user.save();
        console.log(`Successfully imported: ${student.name} (${student.email})`);
      } catch (error) {
        console.error(`Error importing ${student.name}: ${error.message}`);
      }
    }
    
    console.log('Student import process completed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the import
importStudents();