const SUPPORTED_DEPARTMENTS = Object.freeze(['CSE', 'IT', 'CSE(DS)', 'CSE(AI)', 'ECE']);

const DEPARTMENT_ALIASES = Object.freeze({
  CSE: Object.freeze([
    'CSE',
    'Computer Engineering',
    'Computer Science and Engineering',
    'Computer Science & Engineering',
  ]),
  IT: Object.freeze([
    'IT',
    'Information Technology',
  ]),
  'CSE(DS)': Object.freeze([
    'CSE(DS)',
    'CS-DS',
    'CSE-DS',
    'CSE DS',
    'Data Science',
  ]),
  'CSE(AI)': Object.freeze([
    'CSE(AI)',
    'CSE-AIML',
    'CSE(AIML)',
    'CSE-AI',
    'CSE AI',
    'AIML',
  ]),
  ECE: Object.freeze([
    'ECE',
    'Electronics and Communication Engineering',
    'Electronics & Communication Engineering',
    'E&CE',
  ]),
});

const DEPARTMENT_DEFAULTS = Object.freeze({
  CSE: Object.freeze({ name: 'CSE', hod: 'Not assigned', faculty: 0, students: 0, established: 2005 }),
  IT: Object.freeze({ name: 'IT', hod: 'Not assigned', faculty: 0, students: 0, established: 2008 }),
  'CSE(DS)': Object.freeze({ name: 'CSE(DS)', hod: 'Not assigned', faculty: 0, students: 0, established: 2015 }),
  'CSE(AI)': Object.freeze({ name: 'CSE(AI)', hod: 'Not assigned', faculty: 0, students: 0, established: 2020 }),
  ECE: Object.freeze({ name: 'ECE', hod: 'Not assigned', faculty: 0, students: 0, established: 2010 }),
});

const aliasToDepartment = SUPPORTED_DEPARTMENTS.reduce((map, department) => {
  DEPARTMENT_ALIASES[department].forEach(alias => {
    map.set(alias.toLowerCase(), department);
  });
  return map;
}, new Map());

function normalizeDepartmentName(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }

  const trimmed = name.trim();
  return aliasToDepartment.get(trimmed.toLowerCase()) || trimmed;
}

function isSupportedDepartment(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  return aliasToDepartment.has(name.trim().toLowerCase());
}

function getDepartmentAliases(department) {
  return DEPARTMENT_ALIASES[department] || [department];
}

function getAllDepartmentAliases() {
  return SUPPORTED_DEPARTMENTS.flatMap(getDepartmentAliases);
}

function sortByDepartmentOrder(a, b) {
  const aName = typeof a === 'string' ? a : a.name;
  const bName = typeof b === 'string' ? b : b.name;
  const aIndex = SUPPORTED_DEPARTMENTS.indexOf(aName);
  const bIndex = SUPPORTED_DEPARTMENTS.indexOf(bName);

  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;

  return aName.localeCompare(bName);
}

module.exports = {
  SUPPORTED_DEPARTMENTS,
  DEPARTMENT_ALIASES,
  DEPARTMENT_DEFAULTS,
  normalizeDepartmentName,
  isSupportedDepartment,
  getDepartmentAliases,
  getAllDepartmentAliases,
  sortByDepartmentOrder,
};
