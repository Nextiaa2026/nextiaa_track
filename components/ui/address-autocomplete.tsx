"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseNominatimItem,
  type NominatimItem,
  type AddressResult,
} from "@/lib/nominatim";
import { fr } from "@/lib/i18n/fr";

export type { AddressResult } from "@/lib/nominatim";

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = fr.forms.address.placeholder,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const searchAddress = useCallback(async (q: string) => {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(q)}`,
      );
      if (!response.ok) {
        setResults([]);
        return;
      }
      const data = (await response.json()) as NominatimItem[];
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch (error) {
      console.error("Address search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!nextQuery.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void searchAddress(nextQuery);
    }, 450);
  };

  const handleSelect = (item: NominatimItem) => {
    const result = parseNominatimItem(item);
    setQuery(result.displayName);
    setOpen(false);
    onAddressSelect(result);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
          role="listbox"
        >
          {results.map((item, idx) => (
            <li key={`${item.lat}-${item.lon}-${idx}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="w-full px-3 py-2 text-left text-xs/relaxed hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(item)}
              >
                {item.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
