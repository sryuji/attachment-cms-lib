// https://jestjs.io/ja/docs/configuration
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [],
  testEnvironment: 'jsdom',
  automock: false,
  setupFiles: ['./jest.setup.js'],
}
