import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestThrottle } from '@/services/requestThrottle';

describe('RequestThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('最初の呼び出しはすぐに実行される', async () => {
    const throttle = new RequestThrottle();
    const task = vi.fn(async () => 'ok');

    const result = await throttle.run(task);

    expect(result).toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('1 秒以内の次の呼び出しは、1 秒経つまで待ってから実行される', async () => {
    const throttle = new RequestThrottle();
    await throttle.run(async () => undefined);
    const task = vi.fn(async () => undefined);

    const promise = throttle.run(task);
    await vi.advanceTimersByTimeAsync(999);
    expect(task).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('1 秒以上空いていれば、待たずに実行される', async () => {
    const throttle = new RequestThrottle();
    await throttle.run(async () => undefined);
    await vi.advanceTimersByTimeAsync(1500);
    const task = vi.fn(async () => undefined);

    await throttle.run(task);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('連続した呼び出しは 1 秒ずつ間隔をあけて実行される', async () => {
    const throttle = new RequestThrottle();
    const calledAt: number[] = [];
    const task = async () => {
      calledAt.push(Date.now());
    };
    const start = Date.now();

    const promises = [throttle.run(task), throttle.run(task), throttle.run(task)];
    await vi.advanceTimersByTimeAsync(2000);
    await Promise.all(promises);

    expect(calledAt.map((time) => time - start)).toEqual([0, 1000, 2000]);
  });

  it('待機中に中断されると、処理を実行せずに aborted のエラーになる', async () => {
    const throttle = new RequestThrottle();
    await throttle.run(async () => undefined);
    const controller = new AbortController();
    const task = vi.fn(async () => undefined);

    const promise = throttle.run(task, controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ kind: 'aborted' });
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).not.toHaveBeenCalled();
  });

  it('中断済みの signal を渡すと、すぐに aborted のエラーになる', async () => {
    const throttle = new RequestThrottle();
    const controller = new AbortController();
    controller.abort();

    await expect(throttle.run(async () => undefined, controller.signal)).rejects.toMatchObject({
      kind: 'aborted',
    });
  });
});
