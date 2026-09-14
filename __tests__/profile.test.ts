import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/profile/verify/route';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/dbConnect', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  default: { findById: vi.fn() },
}));

import { auth } from '@/auth';

describe('Profile Verify Route', () => {
  it('rejects external document URLs', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123' } } as any);
    const req = new Request('http://localhost/api/profile/verify', {
      method: 'POST',
      body: JSON.stringify({ frontUrl: 'https://unsplash.com/image.jpg' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid document URL/);
  });

  it('accepts valid internal document URLs', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123' } } as any);
    const req = new Request('http://localhost/api/profile/verify', {
      method: 'POST',
      body: JSON.stringify({ frontUrl: '/api/documents/kyc/user123/uuid1.pdf' }),
    });
    const res = await POST(req);
    // Might fail with 404 User not found since we didn't mock findById successfully, but it passes URL validation
    expect(res.status).toBe(404);
  });

  it('rejects another user internal document URLs', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user123' } } as any);
    const req = new Request('http://localhost/api/profile/verify', {
      method: 'POST',
      body: JSON.stringify({ frontUrl: '/api/documents/kyc/other/uuid1.pdf' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
