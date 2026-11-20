import { useEffect, useState } from "react";

/** The value, but only once it has stopped changing for `delay` ms. Keeps typing or row removal from firing a request each time. */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return settled;
}
