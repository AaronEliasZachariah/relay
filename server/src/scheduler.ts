import { runDueCampaigns } from './pipeline/autoSend.js';

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Dev scheduler: poll for due campaigns every minute. Production swaps this for
 * a durable queue + cron (pg-boss on Postgres) — see docs/DATA-PIPELINE.md.
 */
export function startScheduler() {
  if (timer) return;
  const tick = async () => {
    try {
      const n = await runDueCampaigns();
      if (n > 0) console.log(`[scheduler] sent ${n} message(s)`);
    } catch (e) {
      console.error('[scheduler]', e);
    }
  };
  timer = setInterval(tick, 60_000);
  void tick();
  // eslint-disable-next-line no-console
  console.log('▸ scheduler running (campaign tick every minute)');
}
