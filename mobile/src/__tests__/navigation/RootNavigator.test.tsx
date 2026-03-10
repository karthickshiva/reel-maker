import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { RootNavigator } from '../../navigation/RootNavigator';

jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

const { useAuthStore } = jest.requireMock('../../store/useAuthStore') as {
  useAuthStore: jest.Mock;
};

describe('RootNavigator', () => {
  it('renders Auth flow when unauthenticated', async () => {
    useAuthStore.mockReturnValue({ isAuthenticated: false });
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<RootNavigator />);
    });

    const labels = tree!.root.findAll(node => typeof node.props?.children === 'string');
    expect(labels.some(node => node.props.children === 'Auth')).toBe(true);
    expect(labels.some(node => node.props.children === 'Main')).toBe(false);
  });

  it('renders Main flow when authenticated', async () => {
    useAuthStore.mockReturnValue({ isAuthenticated: true });
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<RootNavigator />);
    });

    const labels = tree!.root.findAll(node => typeof node.props?.children === 'string');
    expect(labels.some(node => node.props.children === 'Main')).toBe(true);
    expect(labels.some(node => node.props.children === 'Auth')).toBe(false);
  });
});
