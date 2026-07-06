const XLSX = require('xlsx');

const excelPath = '../../dataset/Student_DataSet.xlsx';
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(ws);

console.log('Looking for potential "priya" conflicts:\n');

const names = excelData.map(row => {
  const name = row["STUDENT'S FULL NAME"];
  const slNo = row['SL. NO.'];
  if (name) {
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    return { slNo, name, firstName };
  }
  return null;
}).filter(x => x);

// Find any that might generate 'priya'
names.forEach(student => {
  if (student.firstName.includes('pry') || student.firstName.includes('pria') || student.firstName === 'priya') {
    console.log(`SL.NO ${student.slNo}: ${student.name} -> ${student.firstName}`);
  }
});

// Show all students up to 70
console.log('\n\nAll students from SL.NO 60-70:');
names.filter(s => s.slNo >= 60 && s.slNo <= 70).forEach(student => {
  console.log(`SL.NO ${student.slNo}: ${student.name}`);
});
