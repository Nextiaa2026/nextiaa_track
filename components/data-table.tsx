"use client";

import React, { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  // Pagination
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  // Selection
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  enableSelection?: boolean;
  // Search & Custom Slots
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<TData>({
  columns: userColumns,
  data,
  pageCount = 1,
  page = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  rowSelection = {},
  onRowSelectionChange,
  enableSelection = true,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  isLoading = false,
}: DataTableProps<TData>) {
  // Memoize columns to include selection checkbox if enabled
  const columns = useMemo(() => {
    if (!enableSelection) return userColumns;

    const selectionColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <div className="px-1 flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-gray-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1 flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-gray-300"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...userColumns];
  }, [userColumns, enableSelection]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    state: {
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    onRowSelectionChange: (updater) => {
      if (onRowSelectionChange) {
        const next =
          typeof updater === "function" ? updater(rowSelection) : updater;
        onRowSelectionChange(next);
      }
    },
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {onSearchChange && (
            <div className="relative w-full max-w-sm group">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-10 rounded-xl border-gray-200 bg-white pl-10 focus-visible:ring-primary/10 transition-all"
              />
            </div>
          )}

          {filters}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {actions}
        </div>
      </div>

      {/* Table Area */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden relative">
        <Table>
          <TableHeader className="bg-gray-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-gray-100 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-normal text-gray-900 h-12"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-gray-50">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-4">
                      <div className="h-4 w-full bg-gray-100 animate-pulse rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 text-gray-600">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-auto p-0 border-none bg-white"
                >
                  {actions && !searchQuery ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        {/* If external empty state is provided, we can render it here */}
                        No data found.
                     </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-gray-400 font-normal">
                      No data found.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
        <div className="text-sm text-gray-500 font-normal order-2 sm:order-1">
          {Object.keys(rowSelection).length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>

        <div className="flex items-center gap-6 lg:gap-8 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
          <div className="flex items-center gap-2">
            <p className="text-sm font-normal text-gray-700 whitespace-nowrap">
              Rows per page
            </p>
            <select
              className="h-9 w-[70px] rounded-xl border border-gray-200 bg-white px-2 py-1 text-sm font-normal shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm font-normal text-gray-700 min-w-[100px] text-center">
              Page <span className="text-primary">{page}</span> of {pageCount}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="size-9 p-0 rounded-xl border-gray-200 disabled:opacity-30"
                onClick={() => onPageChange?.(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-9 p-0 rounded-xl border-gray-200 disabled:opacity-30"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-9 p-0 rounded-xl border-gray-200 disabled:opacity-30"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= pageCount}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-9 p-0 rounded-xl border-gray-200 disabled:opacity-30"
                onClick={() => onPageChange?.(pageCount)}
                disabled={page >= pageCount}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
