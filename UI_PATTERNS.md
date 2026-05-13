# UI Patterns & Components

## Overview

This document describes the UI patterns and components used throughout the application.

## Sheet Components

### Custom Sheet Component

Located in `components/ui/sheet-custom.tsx`

A full-screen sheet that slides from top to bottom (or any direction). Built on Radix UI Dialog.

**Features:**

- Slides from top by default
- Configurable direction (top, bottom, left, right)
- Overlay with backdrop
- Close button
- Smooth animations

**Usage:**

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet-custom";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="top">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    {/* Content */}
    <SheetFooter>{/* Footer buttons */}</SheetFooter>
  </SheetContent>
</Sheet>;
```

### CreateShipmentSheet

Located in `components/sheets/CreateShipmentSheet.tsx`

Full-screen form for creating new shipments.

**Features:**

- Auto-generates tracking numbers
- Manual tracking number option
- Multi-step form layout
- Sender/receiver selection
- Item details (name, description, weight, dimensions, image)
- Shipping cost input
- Estimated delivery date
- Form validation with Zod
- Error handling

**Usage:**

```tsx
import { CreateShipmentSheet } from "@/components/sheets/CreateShipmentSheet";

const [open, setOpen] = useState(false);

<CreateShipmentSheet
  open={open}
  onOpenChange={setOpen}
  onSuccess={() => {
    // Refetch data
  }}
/>;
```

### AddShipmentLogSheet

Located in `components/sheets/AddShipmentLogSheet.tsx`

Full-screen form for adding tracking updates.

**Features:**

- Status selection (pending, in_transit, delivered, failed)
- Location input
- Message textarea
- Form validation
- Error handling

**Usage:**

```tsx
import { AddShipmentLogSheet } from "@/components/sheets/AddShipmentLogSheet";

const [open, setOpen] = useState(false);

<AddShipmentLogSheet
  open={open}
  onOpenChange={setOpen}
  shipmentId={123}
  onSuccess={() => {
    // Refetch data
  }}
/>;
```

## Data Table Component

Located in `components/data-table-custom.tsx`

Reusable data table component using TanStack Table.

**Features:**

- Sorting
- Filtering
- Pagination
- Responsive design
- Custom cell rendering

**Usage:**

```tsx
import { DataTable } from "@/components/data-table-custom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table";

const columns: ColumnDef<Shipment>[] = [
  {
    accessorKey: "trackingNumber",
    header: "Tracking #",
    cell: (info) => <span>{info.getValue()}</span>,
  },
  // ... more columns
];

const table = useReactTable({
  data: shipments,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

<DataTable table={table} columns={columns} />;
```

## Utility Functions

Located in `lib/utils/shipment.ts`

### generateShipmentNumber()

Generates a unique shipment number.

**Format:** `SHIP-YYYYMMDD-XXXXX`

**Example:** `SHIP-20240115-12345`

```tsx
const shipmentNumber = generateShipmentNumber();
```

### generateTrackingNumber()

Generates a unique tracking number.

**Format:** `TRK-YYYYMMDD-XXXXX`

**Example:** `TRK-20240115-12345`

```tsx
const trackingNumber = generateTrackingNumber();
```

### isValidTrackingNumber(trackingNumber)

Validates tracking number format.

```tsx
if (isValidTrackingNumber("TRK-20240115-12345")) {
  // Valid
}
```

### isValidShipmentNumber(shipmentNumber)

Validates shipment number format.

```tsx
if (isValidShipmentNumber("SHIP-20240115-12345")) {
  // Valid
}
```

### formatTrackingNumber(trackingNumber)

Formats tracking number for display (uppercase).

```tsx
const formatted = formatTrackingNumber("trk-20240115-12345");
// Returns: 'TRK-20240115-12345'
```

### getStatusColor(status)

Returns Tailwind CSS classes for status badge color.

```tsx
const color = getStatusColor("in_transit");
// Returns: 'bg-blue-100 text-blue-800'
```

### getStatusDisplay(status)

Returns formatted status text for display.

```tsx
const display = getStatusDisplay("in_transit");
// Returns: 'In transit'
```

### formatShippingCost(costInCents)

Formats shipping cost for display.

```tsx
const formatted = formatShippingCost(5000);
// Returns: '$50.00'
```

## Page Layouts

### Shipments List Page

`app/dashboard/shipments/page.tsx`

**Features:**

- Data table with shipments
- Search/filter functionality
- Create shipment button (opens sheet)
- Pagination
- Status badges
- View button for each shipment

### Shipment Detail Page

`app/dashboard/shipments/[id]/page.tsx`

**Features:**

- Shipment details card
- Sender information
- Receiver information
- Tracking history timeline
- Add update button (opens sheet)

## Form Patterns

### Multi-step Forms

Forms are organized into logical sections:

1. **Tracking Information**
   - Tracking number (auto-generated or manual)

2. **Parties**
   - Sender selection
   - Receiver selection

3. **Item Details**
   - Item name
   - Description
   - Weight
   - Dimensions
   - Image URL

4. **Shipping**
   - Shipping cost
   - Estimated delivery

### Validation

All forms use Zod schemas for validation:

```tsx
const schema = z.object({
  trackingNumber: z.string().min(5),
  senderId: z.number().int(),
  // ... more fields
});

const {
  register,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});
```

### Error Handling

Errors are displayed:

- Inline under each field
- In a banner at the bottom of the form

## Color Scheme

### Status Colors

- **Pending:** Gray (bg-gray-100 text-gray-800)
- **In Transit:** Blue (bg-blue-100 text-blue-800)
- **Delivered:** Green (bg-green-100 text-green-800)
- **Failed:** Red (bg-red-100 text-red-800)

## Responsive Design

All components are responsive:

- Mobile: Single column, full-width sheets
- Tablet: Two columns where appropriate
- Desktop: Full layout with sidebars

## Accessibility

- All forms have proper labels
- Error messages are associated with fields
- Buttons have proper ARIA labels
- Keyboard navigation supported
- Color not the only indicator (text labels used)

## Animation

- Sheet slides from top with smooth animation
- Overlay fades in/out
- Transitions on hover states
- Loading spinners for async operations

## Best Practices

1. **Use Sheets for Forms**
   - Create/edit operations use full-screen sheets
   - Keeps main page context visible

2. **Data Tables for Lists**
   - Use DataTable component for all lists
   - Consistent pagination and filtering

3. **Utility Functions**
   - Use shipment utilities for formatting
   - Centralized logic for consistency

4. **Error Handling**
   - Always show error messages
   - Provide actionable feedback

5. **Loading States**
   - Show spinners during async operations
   - Disable buttons while loading

6. **Validation**
   - Use Zod schemas for all forms
   - Show inline error messages
