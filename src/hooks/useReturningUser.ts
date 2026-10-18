import { db } from "../lib/db";
import { useLiveDexie } from "./useDexie";

// True once this browser has used the workspace: a saved profile or any
// record. Lets the landing page offer "Go to my workspace" instead of a
// cold start.
export function useReturningUser(): boolean {
  const { value } = useLiveDexie(async () => {
    const counts = await Promise.all([
      db.settings.count(),
      db.supplies.count(),
      db.demands.count(),
      db.prices.count(),
    ]);

    return counts.some((count) => count > 0);
  }, []);

  return value ?? false;
}
