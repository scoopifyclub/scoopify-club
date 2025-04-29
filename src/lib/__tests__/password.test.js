import { validatePassword } from '../password';
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(),
}));
describe('Password Validation', () => {
    it('should validate strong passwords correctly', () => {
        const strongPassword = 'Test123!@#';
        const result = validatePassword(strongPassword);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe('strong');
        expect(result.errors).toHaveLength(0);
    });
    it('should reject weak passwords', () => {
        const weakPassword = '123';
        const result = validatePassword(weakPassword);
        expect(result.isValid).toBe(false);
        expect(result.strength).toBe('weak');
        expect(result.errors.length).toBeGreaterThan(0);
    });
    it('should require uppercase letters', () => {
        const password = 'test123!@#';
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });
    it('should require lowercase letters', () => {
        const password = 'TEST123!@#';
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });
    it('should require numbers', () => {
        const password = 'TestPassword!@#';
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
    });
    it('should require special characters', () => {
        const password = 'TestPassword123';
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
    });
    it('should require minimum length', () => {
        const password = 'Te1!';
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
    });
});
