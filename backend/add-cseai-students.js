const xlsx = require('xlsx');

// Sample student data for CSE(AI)
const newStudents = [
  {
    'SL. NO.': 69,
    "STUDENT'S FULL NAME": "Aditya Sharma",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder1/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'aditya.sharma@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.5
  },
  {
    'SL. NO.': 70,
    "STUDENT'S FULL NAME": "Priya Verma",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder2/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'priya.verma@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.8
  },
  {
    'SL. NO.': 71,
    "STUDENT'S FULL NAME": "Rohan Gupta",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder3/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'rohan.gupta@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.2
  },
  {
    'SL. NO.': 72,
    "STUDENT'S FULL NAME": "Neha Singh",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder4/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'neha.singh@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.6
  },
  {
    'SL. NO.': 73,
    "STUDENT'S FULL NAME": "Arjun Patel",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder5/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'arjun.patel@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.3
  },
  {
    'SL. NO.': 74,
    "STUDENT'S FULL NAME": "Divya Nair",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder6/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'divya.nair@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.9
  },
  {
    'SL. NO.': 75,
    "STUDENT'S FULL NAME": "Vikram Kumar",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder7/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'vikram.kumar@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.4
  },
  {
    'SL. NO.': 76,
    "STUDENT'S FULL NAME": "Sneha Iyer",
    "  UPLOAD LINK OF UPDATED FORMAL PHOTO IN PDF FORMAT ( Mandatory Field)": "https://drive.google.com/file/d/placeholder8/view",
    'STREAM': 'CSE(AI)',
    'EMAIL ADDRESS - GMAIL': 'sneha.iyer@gmail.com',
    'B.TECH  AVERAGE CGPA': 7.7
  }
];

// Read existing Excel file
const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
const workbook = xlsx.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const existingData = xlsx.utils.sheet_to_json(worksheet);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         ADDING STUDENTS FOR CSE(AI) DEPARTMENT                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`Existing students: ${existingData.length}`);
console.log(`New students to add: ${newStudents.length}`);

// Add new students to existing data
const allData = [...existingData, ...newStudents];

console.log(`Total students after adding: ${allData.length}\n`);

// Write back to Excel
const newWorksheet = xlsx.utils.json_to_sheet(allData);
workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
xlsx.writeFile(workbook, filePath);

console.log('✓ New students added:');
newStudents.forEach((student, index) => {
  console.log(`  ${index + 1}. ${student["STUDENT'S FULL NAME"]} (${student['EMAIL ADDRESS - GMAIL']}) - ${student['STREAM']} - CGPA: ${student['B.TECH  AVERAGE CGPA']}`);
});

console.log(`\n✅ Excel file updated successfully!`);
console.log(`📄 File: d:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx`);
