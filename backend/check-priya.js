const XLSX = require('xlsx');

const excelPath = '../../dataset/Student_DataSet.xlsx';
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(ws);

console.log('All students with their generated emails:\n');

const emailCount = {};
const nameToEmail = {};

excelData.forEach(row => {
  const name = row["STUDENT'S FULL NAME"];
  const slNo = row['SL. NO.'];
  if (name) {
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    nameToEmail[`${slNo}`] = { name, firstName };
    emailCount[firstName] = (emailCount[firstName] || 0) + 1;
  }
});

// Show students with email "priya"
console.log('Students with firstName "priya":');
Object.keys(nameToEmail).forEach(slNo => {
  if (nameToEmail[slNo].firstName === 'priya') {
    console.log(`SL.NO ${slNo}: ${nameToEmail[slNo].name}`);
  }
});

console.log('\nStudents with firstName that will start with "p":');
Object.keys(nameToEmail).forEach(slNo => {
  if (nameToEmail[slNo].firstName.startsWith('p')) {
    console.log(`SL.NO ${slNo}: ${nameToEmail[slNo].name} -> ${nameToEmail[slNo].firstName}@gmail.com`);
  }
});
