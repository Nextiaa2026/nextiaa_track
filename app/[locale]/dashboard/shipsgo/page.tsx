"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CheckListIcon, 
  Settings02Icon, 
  SharingIcon, 
  SecurityIcon,
  ActivityIcon,
  CloudIcon
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export default function ShipsGoPage() {
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast.success("ShipsGo API connection established successfully");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="ShipsGo Integration" 
        description="Connect your ShipsGo account to automate tracking updates and vessel monitoring."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HugeiconsIcon icon={CloudIcon} size={20} className="text-blue-600" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Provider</span>
              <span className="text-sm font-bold">ShipsGo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500 hover:bg-green-600" : ""}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Last Sync</span>
              <span className="text-sm font-medium">{isConnected ? "Just now" : "Never"}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant={isConnected ? "outline" : "default"} 
              className="w-full font-bold"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : isConnected ? "Refresh Connection" : "Establish Connection"}
            </Button>
          </CardFooter>
        </Card>

        {/* Configuration Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HugeiconsIcon icon={Settings02Icon} size={20} className="text-blue-600" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your API credentials to allow Nexiaa to communicate with ShipsGo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">ShipsGo API Key</Label>
              <div className="relative">
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder="Enter your API Key" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <HugeiconsIcon icon={SecurityIcon} size={16} className="text-muted-foreground" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Your API Key can be found in the ShipsGo Dashboard under Settings {" > "} API.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret</Label>
              <Input 
                id="webhook-secret" 
                type="password" 
                placeholder="Enter Webhook Secret" 
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Required for verifying incoming tracking updates from ShipsGo.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button className="ml-auto font-bold" onClick={() => toast.success("Configuration saved")}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webhook Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HugeiconsIcon icon={SharingIcon} size={20} className="text-blue-600" />
              Webhook Endpoint
            </CardTitle>
            <CardDescription>
              Use this URL in your ShipsGo dashboard to receive real-time updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all">
              https://nexiaa-track.vercel.app/api/integrations/shipsgo/webhook
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText("https://nexiaa-track.vercel.app/api/integrations/shipsgo/webhook");
              toast.success("Webhook URL copied to clipboard");
            }}>
              Copy URL
            </Button>
          </CardContent>
        </Card>

        {/* Sync Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HugeiconsIcon icon={ActivityIcon} size={20} className="text-blue-600" />
              Integration Activity
            </CardTitle>
            <CardDescription>
              Recent activity from the ShipsGo integration service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <HugeiconsIcon icon={CheckListIcon} size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">Automatic Sync Enabled</p>
                  <p className="text-[10px] text-muted-foreground">All shipments will be monitored automatically.</p>
                </div>
                <Badge className="ml-auto">Active</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <HugeiconsIcon icon={ActivityIcon} size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold">24 Active Monitors</p>
                  <p className="text-[10px] text-muted-foreground">Currently tracking 24 vessel shipments via ShipsGo.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
