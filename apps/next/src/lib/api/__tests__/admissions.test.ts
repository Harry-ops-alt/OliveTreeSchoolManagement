import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateAdmissionStatus } from '../admissions';
import { fetchJson, ApiError } from '../fetch-json';

vi.mock('../fetch-json');

const mockedFetchJson = fetchJson as unknown as ReturnType<typeof vi.fn>;

describe('updateAdmissionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends PATCH request with admission id and status', async () => {
    mockedFetchJson.mockResolvedValueOnce(undefined);

    await expect(updateAdmissionStatus('adm-123', 'APPROVED')).resolves.toBeUndefined();

    expect(mockedFetchJson).toHaveBeenCalledWith('/admissions/adm-123/status', {
      method: 'PATCH',
      body: { status: 'APPROVED' },
    });
  });

  it('propagates ApiError responses', async () => {
    const apiError = new ApiError(500, 'Internal error');
    mockedFetchJson.mockRejectedValueOnce(apiError);

    await expect(updateAdmissionStatus('adm-987', 'REJECTED')).rejects.toBe(apiError);
  });
});
