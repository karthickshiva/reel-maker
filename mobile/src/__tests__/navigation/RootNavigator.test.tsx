import fs from 'node:fs';
import path from 'node:path';

describe('RootNavigator', () => {
  const rootNavigatorPath = path.resolve(
    __dirname,
    '../../navigation/RootNavigator.tsx',
  );
  const source = fs.readFileSync(rootNavigatorPath, 'utf8');

  it('renders AuthNavigator when unauthenticated', () => {
    expect(source).toContain('isAuthenticated ?');
    expect(source).toContain('name="Auth"');
  });

  it('renders MainTabNavigator when authenticated', () => {
    expect(source).toContain('name="Main"');
  });
});
