import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildWsUrl } from '@/config';

/**
 * Global WebSocket hook for SkyPDV
 * Connects to the main backend and listens for notifications
 *
 * For SkyPDV standalone we are disabling backend websocket notifications
 * to avoid noisy logs and 403s. Hardware plugin websocket (localhost:8000)
 * keeps working via src/lib/hardwarePlugin.ts.
 */
export function useSkyWebsocket() {
    const { token, isAuthenticated } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<any>();

    // Flag to keep compatibility if we ever need to re-enable
    const ENABLE_REMOTE_WS = import.meta.env.VITE_ENABLE_REMOTE_WS === 'true';

    useEffect(() => {
        // Skip entirely unless explicitly enabled
        if (!ENABLE_REMOTE_WS) {
            if (wsRef.current) {
                wsRef.current.close();
            }
            setIsConnected(false);
            return;
        }

        if (!isAuthenticated || !token) {
            if (wsRef.current) {
                wsRef.current.close();
            }
            return;
        }

        const connect = () => {
            const wsRoot = buildWsUrl("/ws");
            const wsUrl = `${wsRoot}?token=${encodeURIComponent(token)}&app_type=SkyPDV`;

            console.log('Connecting to SkyWebsocket...');
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('SkyWebsocket connected');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Dispatch a custom event so any component can listen
                    const notificationEvent = new CustomEvent('new-notification', {
                        detail: data
                    });
                    window.dispatchEvent(notificationEvent);

                    // If it's a notification type from our backend
                    if (data.type === 'notification' || data.type === 'notification_new') {
                        const notifData = data.data || {};

                        // Handle specific types (e.g., new order)
                        if (notifData.type === 'order_created' || data.tipo === 'order_created') {
                            // We dispatch a more specific event too
                            window.dispatchEvent(new CustomEvent('fastfood-new-order', { detail: data }));
                        }
                    }
                } catch (e) {
                    console.error('Error parsing SkyWebsocket message:', e);
                }
            };

            ws.onclose = (event) => {
                console.log('SkyWebsocket disconnected', event.reason);
                setIsConnected(false);

                // Polyfill for reconnect (limit attempts)
                if (isAuthenticated && token && event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(connect, 5000);
                }
            };

            ws.onerror = (error) => {
                console.error('SkyWebsocket error:', error);
            };
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [isAuthenticated, token]);

    return { isConnected };
}
