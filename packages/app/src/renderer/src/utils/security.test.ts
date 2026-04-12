import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyBiliKey } from './security';
import { configApi } from '@renderer/apis';
import showInput from '@renderer/components/showInput';

// Mock dependencies
vi.mock('@renderer/apis', () => ({
  configApi: {
    verifyBiliKey: vi.fn(),
  },
}));

vi.mock('@renderer/components/showInput', () => ({
  default: vi.fn(),
}));

describe('verifyBiliKey logic (Real module test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 模拟 window.isWeb 为 true
    (global as any).window = (global as any).window || {};
    (global as any).window.isWeb = true;
  });

  it('should return true if not in web environment', async () => {
    (global as any).window.isWeb = false;
    const result = await verifyBiliKey();
    expect(result).toBe(true);
    expect(showInput).not.toHaveBeenCalled();
  });

  it('should return false and call onBlocked with "cancelled" when user cancels input', async () => {
    (showInput as any).mockResolvedValue(undefined);
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('cancelled');
  });

  it('should return false and call onBlocked with "mismatch" when user input is empty string', async () => {
    (showInput as any).mockResolvedValue('   ');
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('mismatch');
  });

  it('should return true when API returns ok', async () => {
    (showInput as any).mockResolvedValue('valid-key');
    (configApi.verifyBiliKey as any).mockResolvedValue({ reason: 'ok' });
    
    const result = await verifyBiliKey();
    
    expect(result).toBe(true);
    expect(configApi.verifyBiliKey).toHaveBeenCalledWith('valid-key');
  });

  it('should return false and call onBlocked with "missing" when API returns missing', async () => {
    (showInput as any).mockResolvedValue('some-key');
    (configApi.verifyBiliKey as any).mockResolvedValue({ reason: 'missing' });
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('missing');
  });

  it('should return false and call onBlocked with "mismatch" when API returns mismatch', async () => {
    (showInput as any).mockResolvedValue('wrong-key');
    (configApi.verifyBiliKey as any).mockResolvedValue({ reason: 'mismatch' });
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('mismatch');
  });

  it('should return false and call onBlocked with "error" when API returns unknown reason', async () => {
    (showInput as any).mockResolvedValue('key');
    (configApi.verifyBiliKey as any).mockResolvedValue({ reason: 'unexpected' });
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('error');
  });

  it('should return false and call onBlocked with "error" when API throws error', async () => {
    (showInput as any).mockResolvedValue('key');
    (configApi.verifyBiliKey as any).mockRejectedValue(new Error('Network error'));
    const onBlocked = vi.fn();
    
    const result = await verifyBiliKey({ onBlocked });
    
    expect(result).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('error');
  });
});
