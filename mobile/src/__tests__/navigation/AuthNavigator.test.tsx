import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { AuthNavigator } from '../../navigation/AuthNavigator';

describe('AuthNavigator', () => {
  it('renders Welcome, Login, and SignUp routes', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<AuthNavigator />);
    });

    const labels = tree!.root
      .findAllByType('Text')
      .map(node => String(node.props.children));

    expect(labels).toEqual(expect.arrayContaining(['Welcome', 'Login', 'SignUp']));
  });
});
