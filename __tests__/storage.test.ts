import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStorageDriver, LocalPersistentStorageDriver } from '../src/lib/storage';
import fs from 'fs';

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs') as any;
  return {
    ...actual,
    default: {
      ...actual,
      accessSync: vi.fn(),
      existsSync: vi.fn().mockReturnValue(true),
      mkdirSync: vi.fn(),
    }
  };
});

describe('Storage Infrastructure', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
  });

  it('initializes LocalPersistentStorageDriver successfully when directories are writable', () => {
    const driver = getStorageDriver();
    expect(driver).toBeInstanceOf(LocalPersistentStorageDriver);
  });

  it('throws an error in production if storage is not writable', () => {
    process.env.NODE_ENV = 'production';
    vi.mocked(fs.accessSync).mockImplementationOnce(() => {
      throw new Error('Permission denied');
    });
    
    expect(() => getStorageDriver()).toThrow(/STORAGE ACCESS DENIED IN PRODUCTION/);
  });
});
