// Adaptive polling for the outbound-only Public Captain worker.
// Keeping this loop dependency-injected makes its timing behavior testable
// without importing worker secrets, the corpus, or model/runtime code.

export const EMPTY_QUEUE_BACKOFF_MS = Object.freeze([
  2_000,
  5_000,
  15_000,
  30_000,
  60_000,
]);

export class AdaptivePollBackoff {
  constructor(delays = EMPTY_QUEUE_BACKOFF_MS) {
    if (!Array.isArray(delays) || delays.length === 0 || delays.some((delay) => !Number.isFinite(delay) || delay <= 0)) {
      throw new TypeError('poll backoff requires one or more positive finite delays');
    }
    this.delays = [...delays];
    this.index = 0;
  }

  reset() {
    this.index = 0;
  }

  nextDelay() {
    const delay = this.delays[Math.min(this.index, this.delays.length - 1)];
    if (this.index < this.delays.length - 1) this.index += 1;
    return delay;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runPollingLoop({
  claimJob,
  processJob,
  sleep = defaultSleep,
  isRunning = () => true,
  onWait = () => {},
  onError = () => {},
  backoff = new AdaptivePollBackoff(),
}) {
  while (isRunning()) {
    try {
      const claim = await claimJob();
      if (!claim.ok) {
        const delay = backoff.nextDelay();
        onWait({ delay, reason: 'empty' });
        await sleep(delay);
        continue;
      }

      // A real job means demand is active. Reset before processing so the
      // next empty/error wait starts at 2s, and check immediately after a
      // completed job so queued bursts drain without an artificial delay.
      backoff.reset();
      await processJob(claim.job);
    } catch (error) {
      // Claim and processing failures use the same capped backoff. A broker
      // outage therefore cannot recreate the former 1.5-second retry loop.
      const delay = backoff.nextDelay();
      onError(error);
      onWait({ delay, reason: 'error' });
      await sleep(delay);
    }
  }
}
