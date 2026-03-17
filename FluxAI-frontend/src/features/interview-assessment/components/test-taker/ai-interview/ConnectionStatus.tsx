import React from 'react';
import { useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
    const connectionState = useConnectionState();

    const getStatusConfig = () => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return { text: 'Connected', color: 'bg-green-500', icon: Wifi };
            case ConnectionState.Connecting:
                return { text: 'Connecting...', color: 'bg-yellow-500 animate-pulse', icon: Wifi };
            case ConnectionState.Reconnecting:
                return { text: 'Reconnecting...', color: 'bg-orange-500 animate-pulse', icon: Wifi };
            case ConnectionState.Disconnected:
                return { text: 'Disconnected', color: 'bg-red-500', icon: WifiOff };
            default:
                return { text: 'Unknown', color: 'bg-gray-500', icon: Wifi };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background text-xs font-medium shadow-sm">
            <div className={cn("w-2 h-2 rounded-full", config.color)} />
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{config.text}</span>
        </div>
    );
}
