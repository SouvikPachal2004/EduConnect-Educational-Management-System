const xlsx = require('xlsx');
const path = require('path');

// Read the Excel file - correct path to FYP 12/dataset
const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
const workbook = xlsx.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         CURRENT STUDENT DATASET                               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Check departments
const departments = {};
data.forEach(row => {
  const dept = row['Department'] || row['department'];
  if (dept) {
    if (!departments[dept]) {
      departments[dept] = [];
    }
    departments[dept].push(row);
  }
});

console.log('Department Distribution:');
Object.keys(departments).sort().forEach(dept => {
  console.log(`  ${dept}: ${departments[dept].length} students`);
});

console.log('\n\nColumn Headers:', Object.keys(data[0]));

console.log('\n\nSample Data (First 3 rows):');
data.slice(0, 3).forEach((row, index) => {
  console.log(`\nRow ${index + 1}:`);
  Object.keys(row).forEach(key => {
    console.log(`  ${key}: ${row[key]}`);
  });
});

console.log('\n\nTotal Students:', data.length);
