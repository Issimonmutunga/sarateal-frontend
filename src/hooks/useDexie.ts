import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

export interface LiveQueryResult<T> {
  value: T | undefined;
  error: Error | null;
  isLoading: boolean;
}

export function useLiveDexie<T>(query: () => Promise<T>, deps: unknown[]): LiveQueryResult<T> {
  const [value, setValue] = useState<T>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const observable = liveQuery(async () => (await query()) as T);
    const subscription = observable.subscribe({
      next: (nextValue: T) => {
        setValue(nextValue);
        setError(null);
      },
      error: (nextError: Error) => {
        setError(nextError);
      },
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { value, error, isLoading: value === undefined && error === null };
}