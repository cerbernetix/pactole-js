/**
 * Lightweight countdown timer that tracks elapsed, remaining, and expired state.
 *
 * Uses `Date.now()` as its clock source so fake-timer utilities can control it
 * deterministically in tests.
 *
 * @example
 * ```ts
 * const timeout = new Timeout(5);
 * console.log(timeout.remaining); // ~5
 * console.log(timeout.expired);   // false
 * timeout.stop();
 * timeout.start(); // resets the clock
 * ```
 */
export class Timeout {
    private _seconds: number;

    private _timestamp: number;

    private _started: boolean;

    /**
     * Create a new `Timeout` instance.
     *
     * @param seconds - Timeout duration in seconds.
     * @param start - When `true` (default), the timer starts immediately at
     *   construction time.
     */
    public constructor(seconds: number, start = true) {
        this._seconds = seconds;
        this._started = start;
        this._timestamp = Date.now();
    }

    /**
     * Timeout duration in seconds.
     */
    public get seconds(): number {
        return this._seconds;
    }

    /**
     * Set a new timeout duration in seconds.
     *
     * The change takes effect on the next expiration check; the reference
     * timestamp is not reset.
     */
    public set seconds(value: number) {
        this._seconds = value;
    }

    /**
     * Whether the timer has been started.
     *
     * A timer that has never been started or has been {@link stop}ped returns `false`.
     */
    public get started(): boolean {
        return this._started;
    }

    /**
     * Seconds elapsed since the timer was last started or reset.
     *
     * Returns `0` when the timer has not been started.
     */
    public get elapsed(): number {
        if (!this._started) {
            return 0;
        }

        return (Date.now() - this._timestamp) / 1000;
    }

    /**
     * Seconds remaining before the timer expires.
     *
     * Returns the full duration when the timer has not been started.
     * Never returns a negative value — clamps to `0` when the timer has
     * already expired.
     */
    public get remaining(): number {
        if (!this._started) {
            return this._seconds;
        }

        return Math.max(0, this._seconds - this.elapsed);
    }

    /**
     * Whether the elapsed time has reached or exceeded the configured duration.
     *
     * Always `false` when the timer has not been started.
     */
    public get expired(): boolean {
        return this.elapsed >= this._seconds;
    }

    /**
     * Start the timer and reset the reference timestamp to now.
     *
     * If the timer was already started this effectively resets it.
     */
    public start(): void {
        this._started = true;
        this.reset();
    }

    /**
     * Reset the reference timestamp to now without changing the started state.
     */
    public reset(): void {
        this._timestamp = Date.now();
    }

    /**
     * Stop the timer.
     *
     * After stopping, {@link elapsed} returns `0`, {@link remaining} returns the
     * full duration, and {@link expired} returns `false` until the timer is
     * restarted.
     */
    public stop(): void {
        this._started = false;
    }
}
