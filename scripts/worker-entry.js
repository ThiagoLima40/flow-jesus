import nextWorker from "../.open-next/worker.js";
import { recoverPayments } from "../src/lib/payment-recovery.ts";

export default {
  ...nextWorker,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(recoverPayments(env));
  },
};
