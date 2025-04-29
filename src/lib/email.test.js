import { sendEmail } from './email';
jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockImplementation((options) => {
                if (options.to === 'test@test.com') {
                    return Promise.resolve({ id: 'test-email-id' });
                }
                return Promise.reject({
                    statusCode: 400,
                    message: 'API key is invalid',
                    name: 'validation_error',
                });
            }),
        },
    })),
}));
describe('Email Utility', () => {
    it('should send email successfully', async () => {
        const result = await sendEmail({
            to: 'test@test.com',
            subject: 'Test Email',
            html: '<p>This is a test email</p>',
        });
        expect(result).toBeDefined();
        expect(result.id).toBe('test-email-id');
    });
    it('should handle email sending errors', async () => {
        await expect(sendEmail({
            to: 'invalid-email',
            subject: 'Test Email',
            html: '<p>This is a test email</p>',
        })).rejects.toThrow('API key is invalid');
    });
});
