import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { Input } from "./ui/Input";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}

/** A search field with the icon on the left. It reports the text 300 ms after typing pauses. */
export function SearchBox({ value, onChange, placeholder, label, className }: SearchBoxProps) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number>(undefined);

  // The address bar can clear the search (for example "Clear filters"), so follow it.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleChange(next: string) {
    setDraft(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(next), 300);
  }

  return (
    <div className={cn("relative w-full min-w-56 sm:max-w-xs", className)}>
      <MagnifyingGlass
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-text"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        className="h-12 pl-9"
      />
    </div>
  );
}
