const XLSX = require('xlsx');

const excelPath = '../../dataset/Student_DataSet.xlsx';
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('📋 Total students in Excel: ' + data.length);
console.log('\nDepartment breakdown:\n');

const deptCount = {};
data.forEach(row => {
  const dept = row['STREAM'];
  deptCount[dept] = (deptCount[dept] || 0) + 1;
});

Object.keys(deptCount).sort().forEach(dept => {
  console.log(`${dept}: ${deptCount[dept]}`);
});

let total = 0;
Object.values(deptCount).forEach(count => total += count);
console.log(`\n✅ Total in Excel: ${total}`);
