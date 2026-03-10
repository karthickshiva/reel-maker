import fs from 'node:fs';
import path from 'node:path';

describe('AuthNavigator', () => {
  it('includes WelcomeScreen -> LoginScreen -> SignUpScreen routes', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../navigation/AuthNavigator.tsx'),
      'utf8',
    );

    expect(source).toContain('name="Welcome"');
    expect(source).toContain('name="Login"');
    expect(source).toContain('name="SignUp"');
  });
});
