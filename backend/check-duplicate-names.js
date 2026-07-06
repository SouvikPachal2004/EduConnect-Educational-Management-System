const XLSX = require('xlsx');

const excelPath = '../../dataset/Student_DataSet.xlsx';
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = XLSX.utils.sheet_to_json(ws);

console.log('Checking for duplicate first names:\n');

const firstNames = {};
excelData.forEach(row => {
  const name = row["STUDENT'S FULL NAME"];
  if (name) {
    const firstName = name.trim().split(/\s+/)[0].toLowerCase();
    if (!firstNames[firstName]) {
      firstNames[firstName] = [];
    }
    firstNames[firstName].push(name);
  }
});

Object.keys(firstNames).forEach(fn => {
  if (firstNames[fn].length > 1) {
    console.log(`${fn}: ${firstNames[fn].length} students`);
    firstNames[fn].forEach(name => {
      console.log(`  - ${name}`);
    });
    console.log();
  }
});
