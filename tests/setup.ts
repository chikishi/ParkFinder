import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => {
  // テストから実際の外部 API を呼び出さないよう、モックの無い通信はエラーにする
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  // 以下は jsdom 環境のテストだけが対象
  if (typeof window !== 'undefined') {
    cleanup();
    window.localStorage.clear();
  }
});

afterAll(() => {
  server.close();
});
