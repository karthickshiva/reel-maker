jest.mock(
  '@react-navigation/native',
  () => {
    const React = require('react');
    const { View } = require('react-native');

    return {
      NavigationContainer: ({ children }) => React.createElement(View, null, children),
    };
  },
  { virtual: true },
);

jest.mock(
  '@react-navigation/native-stack',
  () => {
    const React = require('react');
    const { Text, View } = require('react-native');

    const createNativeStackNavigator = () => ({
      Navigator: ({ children }) => React.createElement(View, null, children),
      Screen: ({ name, component: Component }) =>
        React.createElement(View, null, [
          React.createElement(Text, { key: `${name}-label` }, name),
          React.createElement(Component, { key: `${name}-component` }),
        ]),
      Group: ({ children }) => React.createElement(View, null, children),
    });

    return { createNativeStackNavigator };
  },
  { virtual: true },
);

jest.mock(
  '@react-navigation/bottom-tabs',
  () => {
    const React = require('react');
    const { Text, View } = require('react-native');

    const createBottomTabNavigator = () => ({
      Navigator: ({ children }) => React.createElement(View, null, children),
      Screen: ({ name, component: Component }) =>
        React.createElement(View, null, [
          React.createElement(Text, { key: `${name}-label` }, name),
          React.createElement(Component, { key: `${name}-component` }),
        ]),
    });

    return { createBottomTabNavigator };
  },
  { virtual: true },
);

jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }), {
  virtual: true,
});
