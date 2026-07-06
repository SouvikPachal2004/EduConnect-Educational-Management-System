const xlsx = require('xlsx');

const filePath = 'd:\\EduConnect\\FYP 12\\dataset\\Student_DataSet.xlsx';
const workbook = xlsx.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         CSE(AI) STUDENTS FROM EXCEL                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Get CSE(AI) students
const cseaiStudents = data.filter(row => row['STREAM'] === 'CSE(AI)');

console.log(`CSE(AI) Students in Excel (${cseaiStudents.length}):\n`);

cseaiStudents.forEach(student => {
  console.log(`SL. NO.: ${student['SL. NO.']}`);
  console.log(`Name: ${student["STUDENT'S FULL NAME"]}`);
  console.log(`Email: ${student['EMAIL ADDRESS - GMAIL']}`);
  console.log(`CGPA: ${student['B.TECH  AVERAGE CGPA']}`);
  console.log('');
});
