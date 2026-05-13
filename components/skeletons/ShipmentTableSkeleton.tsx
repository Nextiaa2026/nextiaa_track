"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ShipmentTableSkeleton() {
  return (
    <Card className="p-6">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-gray-50">
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {colIndex === 4 ? (
                      <Skeleton className="h-6 w-16 rounded-full" />
                    ) : (
                      <Skeleton className="h-4 w-24" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </Card>
  );
}
