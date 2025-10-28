module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/dist/**/*.spec.js'],
  collectCoverageFrom: ['dist/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};