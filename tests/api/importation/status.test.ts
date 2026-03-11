/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockAdminClient = {
  from: jest.fn(() => mockAdminClient),
  select: jest.fn(() => mockAdminClient),
  eq: jest.fn(() => mockAdminClient),
  order: jest.fn(() => mockAdminClient),
  limit: jest.fn(() => mockAdminClient),
  single: jest.fn(),
};

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockAdminClient),
}));

describe('GET /api/importation/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when email is missing', async () => {
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 when email not found', async () => {
    mockAdminClient.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status?email=unknown@test.com');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('should return application status when found', async () => {
    mockAdminClient.single.mockResolvedValueOnce({
      data: { id: 'abc', email: 'jane@retailer.co.ke', status: 'pending', admin_note: null, created_at: '2026-03-11T00:00:00Z' },
      error: null,
    });
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status?email=jane@retailer.co.ke');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('pending');
  });

  it('should normalize email lookup to lowercase', async () => {
    mockAdminClient.single.mockResolvedValueOnce({
      data: { id: 'abc', email: 'jane@retailer.co.ke', status: 'approved', admin_note: null, created_at: '2026-03-11T00:00:00Z' },
      error: null,
    });
    const { GET } = await import('@/app/api/importation/status/route');
    const req = new NextRequest('http://localhost/api/importation/status?email=JANE@RETAILER.CO.KE');
    const res = await GET(req);
    expect(res.status).toBe(200);
    // Verify the eq call used the lowercased email
    expect(mockAdminClient.eq).toHaveBeenCalledWith('email', 'jane@retailer.co.ke');
  });
});
