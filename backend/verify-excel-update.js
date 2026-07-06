const XLSX = require('xlsx');

const excelPath = '../../dataset/Student_DataSet.xlsx';
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('✅ Sample 3 students from Excel:\n');
data.slice(0, 3).forEach((row, idx) => {
  console.log(`${idx + 1}. ${row["STUDENT'S FULL NAME"]}`);
  console.log(`   Email: ${row['EMAIL ADDRESS - GMAIL']}`);
  console.log(`   CGPA: ${row['B.TECH  AVERAGE CGPA']}\n`);
});

console.log(`\n✅ Total students in Excel: ${data.length}`);
