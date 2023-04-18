import { describe, expect, it } from 'vitest';
import { getResponse } from './response-helper';

describe('getResponse()', () => {
  it('should return a response object with the specified data and status', async () => {
    const data = {
      name: 'John',
      age: 30,
    };
    const response = getResponse(data, 200);
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    const json_text = await response.text();
    expect(json_text).toBe(JSON.stringify(data, null, 4));
  });
});
