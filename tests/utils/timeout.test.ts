import { afterEach, describe, expect, it, vi } from 'vitest';

import { Timeout } from 'src/utils/index.ts';

describe('Timeout', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('initializes with start=true by default', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(5);

        expect(timeout.seconds).toBe(5);
        expect(timeout.started).toBe(true);
        expect(timeout.elapsed).toBe(0);
        expect(timeout.remaining).toBe(5);
        expect(timeout.expired).toBe(false);
    });

    it('initializes with start=false', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(5, false);

        expect(timeout.started).toBe(false);
        expect(timeout.elapsed).toBe(0);
        expect(timeout.remaining).toBe(5);
        expect(timeout.expired).toBe(false);
    });

    it('updates the seconds property', () => {
        const timeout = new Timeout(5);
        timeout.seconds = 10;
        expect(timeout.seconds).toBe(10);
    });

    it('tracks elapsed and remaining time while started', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(1);

        vi.advanceTimersByTime(100);

        expect(timeout.elapsed).toBe(0.1);
        expect(timeout.remaining).toBe(0.9);
        expect(timeout.expired).toBe(false);
    });

    it('never returns a negative remaining time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(0.1);

        vi.advanceTimersByTime(200);

        expect(timeout.remaining).toBe(0);
        expect(timeout.expired).toBe(true);
    });

    it('starts a stopped timeout and resets elapsed time', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(5, false);

        timeout.start();

        expect(timeout.started).toBe(true);
        expect(timeout.elapsed).toBe(0);
        expect(timeout.remaining).toBe(5);
    });

    it('reset restarts the timer without changing started state', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(5);

        vi.advanceTimersByTime(100);
        expect(timeout.elapsed).toBe(0.1);

        timeout.reset();

        expect(timeout.started).toBe(true);
        expect(timeout.elapsed).toBe(0);
    });

    it('stop prevents elapsed time from progressing', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(1);

        vi.advanceTimersByTime(100);
        timeout.stop();
        vi.advanceTimersByTime(100);

        expect(timeout.started).toBe(false);
        expect(timeout.elapsed).toBe(0);
        expect(timeout.remaining).toBe(1);
        expect(timeout.expired).toBe(false);
    });

    it('supports start-stop-start workflows', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(5, false);

        timeout.start();
        vi.advanceTimersByTime(100);
        expect(timeout.elapsed).toBe(0.1);

        timeout.stop();
        expect(timeout.elapsed).toBe(0);

        timeout.start();
        expect(timeout.started).toBe(true);
        expect(timeout.elapsed).toBe(0);
    });

    it('reflects expiration after enough time passes', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(0.1);

        vi.advanceTimersByTime(150);

        expect(timeout.expired).toBe(true);
        expect(timeout.remaining).toBe(0);
    });

    it('supports changing duration during operation', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

        const timeout = new Timeout(1);

        vi.advanceTimersByTime(100);
        timeout.seconds = 2;

        expect(timeout.seconds).toBe(2);
        expect(timeout.remaining).toBeGreaterThan(1.8);
    });
});
