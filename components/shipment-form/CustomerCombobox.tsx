"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Customer } from "@/services/customer.service";
import { fr } from "@/lib/i18n/fr";

interface CustomerComboboxProps {
  customers: Customer[];
  value?: number;
  onSelect: (customerId: number) => void;
  placeholder?: string;
  error?: boolean;
}

export function CustomerCombobox({
  customers,
  value,
  onSelect,
  placeholder = fr.forms.common.selectPlaceholder,
  error,
}: CustomerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredCustomers = React.useMemo(() => {
    if (!search) return customers;
    const lowerSearch = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch) ||
        c.phone.toLowerCase().includes(lowerSearch),
    );
  }, [customers, search]);

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 font-normal rounded-xl",
            !value && "text-muted-foreground",
            error && "border-destructive",
          )}
        >
          {selectedCustomer ? (
            <span className="truncate">
              {selectedCustomer.name} ({selectedCustomer.email})
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col w-full max-h-[300px]">
          <div className="flex items-center border-b px-3 h-10 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={fr.forms.common.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden p-1 flex-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {fr.forms.common.noResults}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === customer.id && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onSelect(customer.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {customer.email} • {customer.phone}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
