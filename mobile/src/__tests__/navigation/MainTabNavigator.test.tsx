import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { MainTabNavigator } from '../../navigation/MainTabNavigator';

describe('MainTabNavigator', () => {
  it('renders all four root tabs', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<MainTabNavigator />);
    });

    const hasLabel = (label: string) =>
      tree!.root.findAll(node => node.props?.children === label).length > 0;

    expect(hasLabel('HomeTab')).toBe(true);
    expect(hasLabel('CreateTab')).toBe(true);
    expect(hasLabel('LibraryTab')).toBe(true);
    expect(hasLabel('ProfileTab')).toBe(true);
  });
});
