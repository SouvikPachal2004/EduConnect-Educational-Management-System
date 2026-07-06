const xlsx = require('xlsx');

// Read existing Excel file
const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
const workbook = xlsx.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         UPDATING CS-DS TO CSE(DS)                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let updateCount = 0;

// Update all CS-DS to CSE(DS)
data.forEach(row => {
  if (row['STREAM'] === 'CS-DS') {
    row['STREAM'] = 'CSE(DS)';
    updateCount++;
  }
});

console.log(`✓ Updated ${updateCount} students from CS-DS to CSE(DS)\n`);

// Write back to Excel
const newWorksheet = xlsx.utils.json_to_sheet(data);
workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
xlsx.writeFile(workbook, filePath);

// Display department distribution
const depts = {};
data.forEach(row => {
  const stream = row['STREAM'];
  if (stream) {
    depts[stream] = (depts[stream] || 0) + 1;
  }
});

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         UPDATED DEPARTMENT DISTRIBUTION                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

Object.keys(depts).sort().forEach(dept => {
  console.log(`  ${dept}: ${depts[dept]} students`);
});

console.log(`\nTotal students: ${data.length}`);
console.log(`\n✅ Excel file updated successfully!`);
console.log(`📄 File: d:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx`);
console.log('\n✓ All department codes are now in SHORT FORM:');
console.log('  - CSE (Computer Science & Engineering)');
console.log('  - CSE(AI) (CSE - AI)');
console.log('  - CSE(DS) (CSE - Data Science)');
console.log('  - CSE-AIML (CSE - AI/ML)');
console.log('  - IT (Information Technology)');
