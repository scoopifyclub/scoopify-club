/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockRequireAdmin = jest.fn();

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: (...args) => mockRequireAdmin(...args),
}));

jest.mock('@/lib/prisma', () => {
  const prisma = {
    employee: { findUnique: jest.fn(), update: jest.fn() },
    systemLog: { create: jest.fn() },
    service: { count: jest.fn() },
  };
  return { __esModule: true, prisma, default: prisma };
});

jest.mock('@/lib/email-service', () => ({
  sendEmail: jest.fn(),
}));

const { prisma } = require('@/lib/prisma');
const { sendEmail } = require('@/lib/email-service');
const { scooperApprovalState } = require('@/lib/scooper-approval');
const route = require('@/app/api/admin/employees/[employeeId]/approval/route');

const USER = { id: 'user_1', email: 'new.scooper@example.com', firstName: '<b>Sam</b>', lastName: 'Lee' };

function call(method, employeeId = 'emp_1') {
  const request = new NextRequest(`http://localhost:3000/api/admin/employees/${employeeId}/approval`, { method });
  return route[method](request, { params: Promise.resolve({ employeeId }) });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({ ok: true, userId: 'admin_1', user: { id: 'admin_1' } });
  prisma.systemLog.create.mockResolvedValue({});
  prisma.employee.update.mockImplementation(async ({ data }) => ({
    id: 'emp_1',
    status: data.status,
    approvedAt: data.approvedAt,
    approvedBy: data.approvedBy,
    user: USER,
  }));
  sendEmail.mockResolvedValue({ success: true });
  prisma.service.count.mockResolvedValue(0);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('admin scooper approval API', () => {
  test.each(['POST', 'DELETE'])('%s requires an admin and touches nothing otherwise', async (method) => {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      response: Response.json({ error: 'Admin access required' }, { status: 403 }),
    });
    const res = await call(method);
    expect(res.status).toBe(403);
    expect(prisma.employee.findUnique).not.toHaveBeenCalled();
    expect(prisma.employee.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('returns 404 for an unknown scooper', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    const res = await call('POST', 'missing');
    expect(res.status).toBe(404);
    expect(prisma.employee.update).not.toHaveBeenCalled();
  });

  test('approving a pending scooper activates them, logs it, and emails them', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', status: 'ACTIVE', approvedAt: null });
    const res = await call('POST');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.emailSent).toBe(true);
    expect(scooperApprovalState(body.employee)).toBe('approved');

    const { data } = prisma.employee.update.mock.calls[0][0];
    expect(data).toMatchObject({ status: 'ACTIVE', approvedBy: 'admin_1' });
    expect(data.approvedAt).toBeInstanceOf(Date);
    expect(prisma.systemLog.create.mock.calls[0][0].data.type).toBe('SCOOPER_APPROVED');

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, template, emailData] = sendEmail.mock.calls[0];
    expect(to).toBe(USER.email);
    expect(template).toBe('custom');
    expect(emailData.html).toContain('&lt;b&gt;Sam&lt;/b&gt;');
    expect(emailData.html).not.toContain('<b>Sam</b>');
  });

  test('reactivating a deactivated scooper approves them again', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', status: 'INACTIVE', approvedAt: null });
    const res = await call('POST');
    expect(res.status).toBe(200);
    expect(prisma.employee.update.mock.calls[0][0].data.status).toBe('ACTIVE');
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test('approving an already-approved scooper keeps approvedAt and does not re-email', async () => {
    const approvedAt = new Date('2026-11-01T00:00:00Z');
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', status: 'ACTIVE', approvedAt });
    const res = await call('POST');
    expect(res.status).toBe(200);
    expect((await res.json()).emailSent).toBe(false);
    expect(prisma.employee.update.mock.calls[0][0].data.approvedAt).toEqual(approvedAt);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('a failed approval email does not fail the approval', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', status: 'ACTIVE', approvedAt: null });
    sendEmail.mockRejectedValue(new Error('SMTP down'));
    const res = await call('POST');
    expect(res.status).toBe(200);
    expect((await res.json()).emailSent).toBe(false);
  });

  test('rejecting/deactivating clears approval, marks INACTIVE, and reports held jobs', async () => {
    prisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', status: 'ACTIVE', approvedAt: new Date() });
    prisma.service.count.mockResolvedValue(2);
    const res = await call('DELETE');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeJobs).toBe(2);
    expect(scooperApprovalState(body.employee)).toBe('inactive');
    expect(prisma.employee.update.mock.calls[0][0].data).toMatchObject({
      status: 'INACTIVE',
      approvedAt: null,
      approvedBy: null,
    });
    expect(prisma.service.count.mock.calls[0][0].where).toEqual({
      employeeId: 'emp_1',
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    });
    expect(prisma.systemLog.create.mock.calls[0][0].data.type).toBe('SCOOPER_APPROVAL_REVOKED');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('scooperApprovalState', () => {
  test('classifies pending, approved, and inactive scoopers', () => {
    expect(scooperApprovalState({ status: 'ACTIVE', approvedAt: null })).toBe('pending');
    expect(scooperApprovalState({ status: 'ACTIVE', approvedAt: '2026-11-01' })).toBe('approved');
    expect(scooperApprovalState({ status: 'INACTIVE', approvedAt: null })).toBe('inactive');
    expect(scooperApprovalState({ status: 'SUSPENDED', approvedAt: '2026-11-01' })).toBe('inactive');
    expect(scooperApprovalState(null)).toBe('inactive');
  });
});
