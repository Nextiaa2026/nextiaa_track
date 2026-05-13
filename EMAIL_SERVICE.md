# Email Service Documentation

## Overview

The email service handles all email notifications for the shipment management system. It's designed to be flexible and can work with various email providers.

## Current Status

- **Status**: Placeholder implementation
- **Provider**: Ready for Resend integration
- **Emails logged to**: Console (for development)

## Supported Email Types

### 1. Shipment Created

Sent to both sender and receiver when a shipment is created.

**Triggers:**

- When a new shipment is created in the system

**Recipients:**

- Sender
- Receiver

**Information included:**

- Tracking number
- Item name
- Sender name
- Receiver name
- Estimated delivery date

### 2. Status Update

Sent when shipment status changes (pending → in_transit → delivered → failed).

**Triggers:**

- When a tracking log is added with a new status

**Recipients:**

- Sender
- Receiver

**Information included:**

- Tracking number
- New status
- Location (if available)
- Update message

### 3. Delivery Confirmation

Sent when shipment is successfully delivered.

**Triggers:**

- When status is updated to "delivered"

**Recipients:**

- Sender
- Receiver

**Information included:**

- Tracking number
- Item name
- Delivery date

### 4. Failed Delivery

Sent when delivery fails.

**Triggers:**

- When status is updated to "failed"

**Recipients:**

- Sender
- Receiver

**Information included:**

- Tracking number
- Failure reason
- Location (if available)

## Implementation Guide

### Step 1: Install Resend

```bash
npm install resend
```

### Step 2: Add Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
```

### Step 3: Update Email Service

Uncomment the Resend implementation in `services/email.service.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  sendShipmentCreatedEmail: async (data: ShipmentCreatedEmail) => {
    const response = await resend.emails.send({
      from: "noreply@shipmentmanager.com",
      to: data.recipient.email,
      subject: `Your shipment ${data.trackingNumber} has been created`,
      html: generateShipmentCreatedTemplate(data),
    });
    return response;
  },
  // ... other methods
};
```

### Step 4: Update Shipment Creation

In `app/api/dashboard/shipments/route.ts`, add email sending:

```typescript
import { emailService } from "@/services/email.service";

// After creating shipment and log
const sender = await db.query.customers.findFirst({
  where: eq(customers.id, validatedData.senderId),
});

const receiver = await db.query.customers.findFirst({
  where: eq(customers.id, validatedData.receiverId),
});

// Send emails
await Promise.all([
  emailService.sendShipmentCreatedEmail({
    recipient: { email: sender.email, name: sender.name },
    trackingNumber: newShipment[0].trackingNumber,
    itemName: newShipment[0].itemName,
    senderName: sender.name,
    receiverName: receiver.name,
    estimatedDelivery: newShipment[0].estimatedDelivery?.toISOString(),
  }),
  emailService.sendShipmentCreatedEmail({
    recipient: { email: receiver.email, name: receiver.name },
    trackingNumber: newShipment[0].trackingNumber,
    itemName: newShipment[0].itemName,
    senderName: sender.name,
    receiverName: receiver.name,
    estimatedDelivery: newShipment[0].estimatedDelivery?.toISOString(),
  }),
]);
```

### Step 5: Update Status Update Handler

In `app/api/dashboard/shipment-logs/route.ts`, add email sending:

```typescript
import { emailService } from "@/services/email.service";

// After creating log and updating shipment
const shipment = await db.query.shipments.findFirst({
  where: eq(shipments.id, validatedData.shipmentId),
  with: { sender: true, receiver: true },
});

// Send status update emails
await Promise.all([
  emailService.sendShipmentStatusUpdateEmail({
    recipient: { email: shipment.sender.email, name: shipment.sender.name },
    trackingNumber: shipment.trackingNumber,
    status: validatedData.status,
    location: validatedData.location,
    message: validatedData.message,
  }),
  emailService.sendShipmentStatusUpdateEmail({
    recipient: { email: shipment.receiver.email, name: shipment.receiver.name },
    trackingNumber: shipment.trackingNumber,
    status: validatedData.status,
    location: validatedData.location,
    message: validatedData.message,
  }),
]);

// Send delivery confirmation if status is delivered
if (validatedData.status === "delivered") {
  await Promise.all([
    emailService.sendDeliveryConfirmationEmail({
      recipient: { email: shipment.sender.email, name: shipment.sender.name },
      trackingNumber: shipment.trackingNumber,
      itemName: shipment.itemName,
      deliveryDate: new Date().toISOString(),
    }),
    emailService.sendDeliveryConfirmationEmail({
      recipient: {
        email: shipment.receiver.email,
        name: shipment.receiver.name,
      },
      trackingNumber: shipment.trackingNumber,
      itemName: shipment.itemName,
      deliveryDate: new Date().toISOString(),
    }),
  ]);
}

// Send failed delivery email if status is failed
if (validatedData.status === "failed") {
  await Promise.all([
    emailService.sendFailedDeliveryEmail({
      recipient: { email: shipment.sender.email, name: shipment.sender.name },
      trackingNumber: shipment.trackingNumber,
      status: validatedData.status,
      location: validatedData.location,
      message: validatedData.message,
    }),
    emailService.sendFailedDeliveryEmail({
      recipient: {
        email: shipment.receiver.email,
        name: shipment.receiver.name,
      },
      trackingNumber: shipment.trackingNumber,
      status: validatedData.status,
      location: validatedData.location,
      message: validatedData.message,
    }),
  ]);
}
```

## Using Email Hooks

### Send Shipment Created Email

```typescript
import { useSendShipmentCreatedEmail } from '@/hooks/useEmail';

export function MyComponent() {
  const { sendEmail, isPending } = useSendShipmentCreatedEmail();

  const handleSend = () => {
    sendEmail({
      recipient: { email: 'user@example.com', name: 'John Doe' },
      trackingNumber: 'TRK-20240115-12345',
      itemName: 'Electronics Package',
      senderName: 'Sender Name',
      receiverName: 'Receiver Name',
      estimatedDelivery: '2024-01-20',
    });
  };

  return <button onClick={handleSend}>Send Email</button>;
}
```

### Send Status Update Email

```typescript
import { useSendStatusUpdateEmail } from '@/hooks/useEmail';

export function MyComponent() {
  const { sendEmail, isPending } = useSendStatusUpdateEmail();

  const handleSend = () => {
    sendEmail({
      recipient: { email: 'user@example.com', name: 'John Doe' },
      trackingNumber: 'TRK-20240115-12345',
      status: 'in_transit',
      location: 'New York, NY',
      message: 'Your package is on its way!',
    });
  };

  return <button onClick={handleSend}>Send Email</button>;
}
```

## Email Templates

Email templates are generated in `services/email.service.ts`. You can customize them by modifying the template generator functions:

- `generateShipmentCreatedTemplate()`
- `generateStatusUpdateTemplate()`
- `generateDeliveryConfirmationTemplate()`
- `generateFailedDeliveryTemplate()`

For production, consider using:

- React Email for component-based templates
- Handlebars for template variables
- Custom HTML templates

## Testing

### Development

Emails are logged to console. Check your terminal for email logs:

```
Email would be sent: {
  to: 'user@example.com',
  subject: 'Your shipment TRK-20240115-12345 has been created'
}
```

### Production

Once Resend is configured, emails will be sent to actual recipients.

## Error Handling

All email methods include error handling:

```typescript
try {
  await emailService.sendShipmentCreatedEmail(data);
} catch (error) {
  console.error("Failed to send email:", error);
  // Handle error appropriately
}
```

## Best Practices

1. **Always send to both parties**: Send emails to both sender and receiver for transparency
2. **Include tracking number**: Always include tracking number for easy reference
3. **Use clear subject lines**: Make it easy to identify email purpose
4. **Provide action links**: Include links to track shipment in emails
5. **Handle failures gracefully**: Don't block shipment creation if email fails
6. **Rate limiting**: Implement rate limiting to prevent email spam
7. **Unsubscribe option**: Include unsubscribe option in emails

## Future Enhancements

- [ ] SMS notifications
- [ ] Push notifications
- [ ] Email templates with React Email
- [ ] Scheduled email reminders
- [ ] Email delivery tracking
- [ ] A/B testing for email content
- [ ] Multi-language support
- [ ] Email preferences per user
