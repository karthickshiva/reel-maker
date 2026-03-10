import fs from 'node:fs';
import path from 'node:path';

describe('MainTabNavigator', () => {
  it('includes all 4 tabs', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../navigation/MainTabNavigator.tsx'),
      'utf8',
    );

    expect(source).toContain('name="HomeTab"');
    expect(source).toContain('name="CreateTab"');
    expect(source).toContain('name="LibraryTab"');
    expect(source).toContain('name="ProfileTab"');
  });
});
