import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserPage from './index.vue';
import { userApi } from '@renderer/apis';
import { verifyBiliKey } from '@renderer/utils';
import { useClipboard } from '@vueuse/core';
import { useNotification } from 'naive-ui';

// Mock dependencies
vi.mock('@renderer/apis', () => ({
  userApi: {
    exportSingle: vi.fn().mockResolvedValue({}),
    exportAll: vi.fn().mockResolvedValue([]),
    getCookie: vi.fn().mockResolvedValue('cookie'),
  },
  taskApi: {
    list: vi.fn().mockResolvedValue({ list: [] }),
  },
}));

vi.mock('@renderer/utils', () => ({
  verifyBiliKey: vi.fn(),
}));

// Mock Naive UI
vi.mock('naive-ui', () => ({
  useNotification: vi.fn(),
  useDialog: vi.fn(),
  useMessage: vi.fn(),
  useLoadingBar: vi.fn(),
}));

vi.mock('@renderer/stores', () => ({
  useUserInfoStore: () => ({
    getUsers: vi.fn(),
    changeUser: vi.fn(),
    userInfo: { uid: 123 },
    userList: [{ uid: 123, name: 'test' }],
  }),
  useAppConfig: () => ({
    appConfig: { webhook: { rooms: {} } },
  }),
}));

vi.mock('@renderer/hooks', () => ({
  useConfirm: () => ({
    warning: vi.fn(),
  }),
}));

vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn(),
}));

vi.mock('pinia', () => ({
  storeToRefs: (store: any) => {
    if (store.appConfig) return { appConfig: { value: store.appConfig } };
    if (store.userInfo) return { userInfo: { value: store.userInfo }, userList: { value: store.userList } };
    return store;
  },
}));

// Mock window.URL for downloadJSON
(global as any).URL = {
  createObjectURL: vi.fn().mockReturnValue('blob:url'),
  revokeObjectURL: vi.fn(),
};

describe('User Page index.vue (Real SFC Behavioral Test)', () => {
  let noticeMocks: any;
  let clipboardMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    noticeMocks = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };
    (useNotification as any).mockReturnValue(noticeMocks);

    clipboardMock = { copy: vi.fn() };
    (useClipboard as any).mockReturnValue(clipboardMock);
  });

  const getComponentMethods = () => {
    // 驱动真实 SFC 的 setup 函数以获取业务方法
    // 这确保了我们运行的是生产代码中的函数，而不是复刻版
    const context = { emit: vi.fn(), attrs: {}, slots: {}, expose: vi.fn() };
    return (UserPage as any).setup({}, context);
  };

  const driveTest = async (reason: string, action: 'exportCurrentAccount' | 'exportAllAccounts' | 'getCookie') => {
    const methods = getComponentMethods();
    
    // 配置 verifyBiliKey mock 行为
    (verifyBiliKey as any).mockImplementation(async (options: any) => {
      if (reason === 'ok') return true;
      options.onBlocked(reason);
      return false;
    });

    // 调用真实业务方法
    if (action === 'exportCurrentAccount') {
      await methods.exportCurrentAccount(123);
    } else if (action === 'exportAllAccounts') {
      await methods.exportAllAccounts();
    } else if (action === 'getCookie') {
      await methods.getCookie(123);
    }

    if (reason !== 'ok') {
      // 1. 验证不同 reason 对应的文案区分
      if (reason === 'missing') {
        expect(noticeMocks.error).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('未配置') }));
      } else if (reason === 'mismatch') {
        expect(noticeMocks.error).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('密钥错误') }));
      } else if (reason === 'error') {
        expect(noticeMocks.error).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('服务异常') }));
      } else if (reason === 'cancelled') {
        expect(noticeMocks.warning).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('已取消') }));
      }

      // 2. 验证 Blocked 时无 success 提示
      expect(noticeMocks.success).not.toHaveBeenCalled();
      
      // 3. 验证 Blocked 时无副作用产生
      expect(userApi.exportSingle).not.toHaveBeenCalled();
      expect(userApi.exportAll).not.toHaveBeenCalled();
      expect(userApi.getCookie).not.toHaveBeenCalled();
      expect(clipboardMock.copy).not.toHaveBeenCalled();
    } else {
      // 4. 验证 Success (ok) 路径继续执行并提示成功
      expect(noticeMocks.success).toHaveBeenCalled();
      if (action === 'exportCurrentAccount') expect(userApi.exportSingle).toHaveBeenCalledWith(123);
      if (action === 'exportAllAccounts') expect(userApi.exportAll).toHaveBeenCalled();
      if (action === 'getCookie') {
        expect(userApi.getCookie).toHaveBeenCalledWith(123);
        expect(clipboardMock.copy).toHaveBeenCalledWith('cookie');
      }
    }
  };

  it('should block and show missing error notice for single export', async () => {
    await driveTest('missing', 'exportCurrentAccount');
  });

  it('should block and show mismatch error notice for all export', async () => {
    await driveTest('mismatch', 'exportAllAccounts');
  });

  it('should block and show service error notice for getCookie', async () => {
    await driveTest('error', 'getCookie');
  });

  it('should show warning notice when user cancels', async () => {
    await driveTest('cancelled', 'exportCurrentAccount');
  });

  it('should proceed to success for getCookie when verified', async () => {
    await driveTest('ok', 'getCookie');
  });
});
