const { hashPassword, verifyPassword } = require('../utils/auth');

describe('Auth Utils', () => {
  test('hash and verify password', () => {
    const password = 'testpass123';
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('wrongpass', hash)).toBe(false);
  });

  test('password trimming', () => {
    const password = 'testpass123';
    const hash = hashPassword(password);
    expect(verifyPassword('  testpass123  ', hash)).toBe(false); // Should not match with spaces
  });
});
