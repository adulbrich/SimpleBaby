module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',

  roots: ['<rootDir>/test', '<rootDir>/app'],
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  setupFiles: ['<rootDir>/test/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': require.resolve('babel-jest'),
  },

  transformIgnorePatterns: [
    'node_modules/(?!(?:' +
      [
        'react-native',
        '@react-native',
        '@react-native-community',
        'react-native-reanimated',
        'react-native-css-interop',
        'react-native-safe-area-context',
        'expo',
        '@expo',
        '@expo/.*',
        'expo-router',
        'expo-modules-core',
        'expo-.*',
        'nativewind',
        'react-clone-referenced-element',
        '@react-navigation',
      ].join('|') +
      ')/)',
  ],

  moduleNameMapper: {
  '^expo-image$': '<rootDir>/test/mocks/expo-image.ts',
  '\\.(png|jpg|jpeg|gif|svg|webp|bmp)$': '<rootDir>/test/mocks/fileMock.js',
  '^@/(.*)$': '<rootDir>/$1'
}

};