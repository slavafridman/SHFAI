import { AsyncLocalStorage } from "node:async_hooks";
const budgets = new AsyncLocalStorage<{ signal: AbortSignal; deadline: number }>();
export function withRequestBudget<T>(signal: AbortSignal, milliseconds: number, work: () => Promise<T>): Promise<T> {
  return budgets.run({ signal, deadline: performance.now() + milliseconds }, work);
}
export function currentRequestBudget() { return budgets.getStore(); }
