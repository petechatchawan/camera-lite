module.exports = {
    preset: 'ts-jest', // Use ts-jest preset to handle TypeScript files
    testEnvironment: 'node', // Use Node.js environment
    modulePathIgnorePatterns: ['<rootDir>/dist/'], // Ignore the dist folder to avoid Haste collisions
    transform: {
        '^.+\\.ts?$': 'ts-jest', // Transform TypeScript files using ts-jest
    },
};