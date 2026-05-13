# ShipsGo Integration Guide

## Overview

The shipment management system is designed to be adaptable for ShipsGo integration. Currently, all tracking logs are manually entered by admins, but the system is structured to easily support automated updates from ShipsGo.

## Current State

- **Manual Logging**: Admins manually add tracking updates via the dashboard
- **Placeholder Endpoints**: ShipsGo integration endpoints are ready but not yet implemented
- **Service Layer**: `shipsGoService` provides a clean interface for future integration

## Architecture

### Service Layer

```typescript
// services/shipsgo.service.ts
export const shipsGoService = {
  processWebhook: async (webhook) => {
    /* ... */
  },
  syncTrackingData: async (trackingNumber) => {
    /* ... */
  },
  getTrackingStatus: async (trackingNumber) => {
    /* ... */
  },
  createShipment: async (shipmentData) => {
    /* ... */
  },
};
```

### API Endpoints

All ShipsGo integration endpoints are located in `/app/api/integrations/shipsgo/`:

1. **POST `/api/integrations/shipsgo/webhook`**
   - Receives real-time tracking updates from ShipsGo
   - Currently logs webhook data, ready for processing

2. **POST `/api/integrations/shipsgo/sync`**
   - Manual sync endpoint for admins
   - Pulls latest tracking data from ShipsGo

3. **GET `/api/integrations/shipsgo/tracking/[trackingNumber]`**
   - Fetches current tracking status from ShipsGo
   - Admin-only endpoint

4. **POST `/api/integrations/shipsgo/shipments`**
   - Creates shipment in ShipsGo when creating locally
   - Optional integration point

## Implementation Steps

### Phase 1: Setup (Current)

- ✅ Service layer created
- ✅ API endpoints scaffolded
- ✅ Manual logging working
- ✅ Database schema ready

### Phase 2: Webhook Integration

When ready to implement:

1. **Get ShipsGo API Credentials**
   - API Key
   - Webhook Secret
   - Base URL

2. **Add Environment Variables**

   ```env
   SHIPSGO_API_KEY=your_api_key
   SHIPSGO_WEBHOOK_SECRET=your_webhook_secret
   SHIPSGO_BASE_URL=https://api.shipsgo.com
   ```

3. **Implement Webhook Processing**

   ```typescript
   // app/api/integrations/shipsgo/webhook/route.ts
   export async function POST(request: NextRequest) {
     // 1. Verify webhook signature
     const isValid = verifyShipsGoSignature(request);
     if (!isValid)
       return NextResponse.json({ error: "Invalid" }, { status: 401 });

     // 2. Parse webhook data
     const webhook = await request.json();

     // 3. Find shipment by tracking number
     const shipment = await db.query.shipments.findFirst({
       where: eq(shipments.trackingNumber, webhook.trackingNumber),
     });

     // 4. Create log entry
     if (shipment) {
       await db.insert(shipmentLogs).values({
         shipmentId: shipment.id,
         status: webhook.status,
         location: webhook.location,
         message: webhook.message,
       });

       // 5. Update shipment status
       await db
         .update(shipments)
         .set({ status: webhook.status })
         .where(eq(shipments.id, shipment.id));

       // 6. Send notifications (optional)
       // await sendNotifications(shipment, webhook);
     }

     return NextResponse.json({ success: true });
   }
   ```

4. **Configure Webhook in ShipsGo Dashboard**
   - Set webhook URL: `https://yourdomain.com/api/integrations/shipsgo/webhook`
   - Select events: tracking updates, delivery confirmation, etc.
   - Save webhook secret for verification

### Phase 3: Automatic Shipment Creation

When creating shipments, optionally push to ShipsGo:

```typescript
// In shipment creation flow
const newShipment = await db.insert(shipments).values({...}).returning();

// Optional: Push to ShipsGo
if (process.env.SHIPSGO_ENABLED === 'true') {
  await shipsGoService.createShipment({
    trackingNumber: newShipment.trackingNumber,
    senderName: sender.name,
    senderEmail: sender.email,
    senderPhone: sender.phone,
    receiverName: receiver.name,
    receiverEmail: receiver.email,
    receiverPhone: receiver.phone,
    itemName: newShipment.itemName,
    itemWeight: newShipment.itemWeight,
    itemDimensions: newShipment.itemDimensions,
  });
}
```

### Phase 4: Manual Sync

Implement manual sync for admins:

```typescript
// In admin dashboard
const { mutate: syncTracking } = useMutation({
  mutationFn: (trackingNumber: string) =>
    shipsGoService.syncTrackingData(trackingNumber),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });
  },
});
```

## Data Mapping

### ShipsGo Status → Local Status

```
ShipsGo Status          → Local Status
pending                 → pending
picked_up               → in_transit
in_transit              → in_transit
out_for_delivery        → in_transit
delivered               → delivered
delivery_failed         → failed
returned                → failed
```

### Webhook Event Structure

```typescript
{
  event: 'tracking_update',
  shipmentId: 'shipsgo_id',
  trackingNumber: 'TRACK123456',
  status: 'in_transit',
  location: 'New York, NY',
  timestamp: '2024-01-15T10:30:00Z',
  metadata: {
    carrier: 'FedEx',
    estimatedDelivery: '2024-01-17',
    signatureRequired: false,
  }
}
```

## Security Considerations

1. **Webhook Verification**
   - Always verify webhook signature
   - Use HMAC-SHA256 with webhook secret

2. **API Key Management**
   - Store in environment variables
   - Never commit to repository
   - Rotate regularly

3. **Rate Limiting**
   - Implement rate limiting on webhook endpoint
   - Prevent duplicate processing

4. **Error Handling**
   - Log all webhook errors
   - Implement retry logic
   - Alert on repeated failures

## Testing

### Manual Testing

1. Create a shipment in the dashboard
2. Manually add tracking logs
3. Verify logs appear in tracking page

### Webhook Testing

Use tools like Postman or curl to test webhook:

```bash
curl -X POST http://localhost:3000/api/integrations/shipsgo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "tracking_update",
    "trackingNumber": "TRACK123456",
    "status": "in_transit",
    "location": "New York, NY",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## Monitoring

### Logs to Monitor

- Webhook receipt and processing
- API call failures
- Status update mismatches
- Notification delivery

### Metrics to Track

- Webhook processing time
- Success/failure rates
- Data sync accuracy
- Notification delivery rates

## Troubleshooting

### Webhook Not Received

1. Check webhook URL in ShipsGo dashboard
2. Verify firewall/network settings
3. Check application logs
4. Test with manual curl request

### Status Not Updating

1. Verify webhook signature validation
2. Check database connection
3. Verify shipment tracking number matches
4. Check for duplicate processing

### Notifications Not Sent

1. Verify email/SMS configuration
2. Check notification service logs
3. Verify recipient email/phone
4. Check rate limiting

## Future Enhancements

- [ ] Real-time webhook processing
- [ ] Automatic shipment creation in ShipsGo
- [ ] Multi-carrier support
- [ ] Advanced tracking analytics
- [ ] Customer notifications (email/SMS)
- [ ] Delivery proof (photos/signatures)
- [ ] Return shipment handling
- [ ] Batch shipment import from ShipsGo
