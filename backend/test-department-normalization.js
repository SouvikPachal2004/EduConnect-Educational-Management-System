const { 
  normalizeDepartmentName, 
  SUPPORTED_DEPARTMENTS,
  getDepartmentAliases 
} = require('./utils/departmentCatalog');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                DEPARTMENT NORMALIZATION TEST                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('🎯 SUPPORTED DEPARTMENTS:');
SUPPORTED_DEPARTMENTS.forEach((dept, index) => {
  console.log(`  ${index + 1}. ${dept}`);
});

console.log('\n🧪 TESTING NORMALIZATION:\n');

const testCases = [
  // Old format → New format
  { input: 'CS-DS',    expected: 'CSE(DS)' },
  { input: 'CSE-AIML', expected: 'CSE(AI)' },
  
  // New format (should stay same)
  { input: 'CSE(DS)',  expected: 'CSE(DS)' },
  { input: 'CSE(AI)',  expected: 'CSE(AI)' },
  
  // Standard departments
  { input: 'CSE',  expected: 'CSE'  },
  { input: 'IT',   expected: 'IT'   },
  { input: 'ECE',  expected: 'ECE'  },
  
  // Aliases
  { input: 'CSE-DS',   expected: 'CSE(DS)' },
  { input: 'CSE(AIML)', expected: 'CSE(AI)' },
  { input: 'Electronics and Communication Engineering', expected: 'ECE' },
  
  // Case variations
  { input: 'cse', expected: 'CSE' },
  { input: 'ece', expected: 'ECE' },
];

let passCount = 0;
let totalTests = testCases.length;

testCases.forEach((test, index) => {
  const result = normalizeDepartmentName(test.input);
  const passed = result === test.expected;
  
  if (passed) {
    console.log(`✅ Test ${index + 1}: "${test.input}" → "${result}"`);
    passCount++;
  } else {
    console.log(`❌ Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
  }
});

console.log(`\n📊 RESULTS: ${passCount}/${totalTests} tests passed`);

if (passCount === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Department normalization is working correctly.\n');
} else {
  console.log('⚠️  Some tests failed. Please check the department catalog configuration.\n');
}

console.log('🔍 DEPARTMENT ALIASES:\n');
SUPPORTED_DEPARTMENTS.forEach(dept => {
  const aliases = getDepartmentAliases(dept);
  console.log(`📁 ${dept}:`);
  aliases.forEach(alias => {
    console.log(`   - ${alias}`);
  });
  console.log('');
});

console.log('✅ Department normalization test completed!\n');