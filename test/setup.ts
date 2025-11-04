import '@testing-library/jest-native/extend-expect';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-reanimated', () =>
    require('react-native-reanimated/mock')
);

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);