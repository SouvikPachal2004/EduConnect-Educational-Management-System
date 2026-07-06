const xlsx = require('xlsx');

const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
const workbook = xlsx.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet);

const depts = {};
data.forEach(row => {
  const stream = row['STREAM'];
  if (stream) {
    depts[stream] = (depts[stream] || 0) + 1;
  }
});

console.log('\nDepartments in Excel:');
Object.keys(depts).sort().forEach(d => {
  console.log(`  ${d}: ${depts[d]} students`);
});

console.log('\nMissing departments:');
const needed = ['CSE', 'CSE(AI)'];
needed.forEach(dept => {
  if (!depts[dept]) {
    console.log(`  ❌ ${dept}: NEEDS STUDENTS`);
  }
});

console.log('\nTotal students:', data.length);
console.log('Next SL. NO. will be:', data.length + 1);
