import { describe, it, expect, vi } from 'vitest';
import { GET } from '../src/app/api/documents/[...id]/route';

// Mock the auth and storage driver
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  getStorageDriver: () => ({
    getPrivateDocument: vi.fn(),
  }),
}));

vi.mock('@/lib/dbConnect', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/Vehicle', () => ({
  default: { exists: vi.fn() },
}));

import { auth } from '@/auth';

describe('KYC Document Route', () => {
  it('rejects unauthenticated users', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/documents/kyc/123/file.pdf');
    const res = await GET(req, { params: Promise.resolve({ id: ['kyc', '123', 'file.pdf'] }) });
    expect(res.status).toBe(401);
  });

  it('rejects path traversal', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123', role: 'renter' } } as any);
    const req = new Request('http://localhost/api/documents/kyc/user123/..%2F..%2Fsecret.pdf');
    const res = await GET(req, { params: Promise.resolve({ id: ['kyc', 'user123', '..%2F..%2Fsecret.pdf'] }) });
    expect(res.status).toBe(400);
  });

  it('allows access to own KYC', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123', role: 'renter' } } as any);
    const req = new Request('http://localhost/api/documents/kyc/user123/file.pdf');
    const res = await GET(req, { params: Promise.resolve({ id: ['kyc', 'user123', 'file.pdf'] }) });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    // Might be 404 because storage mock returns undefined, but it passed authorization
  });

  it('rejects access to other user KYC', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123', role: 'renter' } } as any);
    const req = new Request('http://localhost/api/documents/kyc/otheruser/file.pdf');
    const res = await GET(req, { params: Promise.resolve({ id: ['kyc', 'otheruser', 'file.pdf'] }) });
    expect(res.status).toBe(403);
  });
});
