import { useRef, useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../utils/constants';

// Construct WebSocket URL from API base URL (works for both local and production)
const getSocketUrl = () => {
    // Remove trailing slash if present
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/ws`;
};

const SOCKET_URL = getSocketUrl();

/**
 * Hook to manage a single WebSocket connection using STOMP over SockJS.
 */
const useWebSocket = (token) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const subscriptionsRef = useRef(new Map()); // Map<topic, {callback, subscription}>
    const pendingSubscriptions = useRef(new Map()); // Subscriptions requested before connection

    // Function to actually subscribe to a topic
    const doSubscribe = useCallback((client, topic, callback) => {
        if (!client || !client.connected) return null;

        console.log(`[WebSocket] Subscribing to: ${topic}`);
        const subscription = client.subscribe(topic, (message) => {
            try {
                const data = JSON.parse(message.body);
                console.log(`[WebSocket] Received on ${topic}:`, data);
                callback(data);
            } catch (e) {
                console.error(`[WebSocket] Error parsing message on ${topic}:`, e);
            }
        });
        return subscription;
    }, []);

    const connect = useCallback(() => {
        if (clientRef.current && clientRef.current.active) {
            console.log('[WebSocket] Already connected or connecting');
            return;
        }

        console.log('[WebSocket] Connecting...');
        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // Uncomment for detailed STOMP debugging
                // console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('[WebSocket] Connected successfully!');
            setConnected(true);

            // Process any pending subscriptions
            pendingSubscriptions.current.forEach((callback, topic) => {
                const subscription = doSubscribe(client, topic, callback);
                if (subscription) {
                    subscriptionsRef.current.set(topic, { callback, subscription });
                }
            });
            pendingSubscriptions.current.clear();

            // Re-subscribe to existing topics on reconnect
            subscriptionsRef.current.forEach(({ callback }, topic) => {
                const subscription = doSubscribe(client, topic, callback);
                if (subscription) {
                    subscriptionsRef.current.set(topic, { callback, subscription });
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('[WebSocket] STOMP error:', frame.headers['message']);
            setConnected(false);
        };

        client.onWebSocketError = (error) => {
            console.error('[WebSocket] WebSocket error:', error);
        };

        client.onDisconnect = () => {
            console.log('[WebSocket] Disconnected');
            setConnected(false);
        };

        client.activate();
        clientRef.current = client;
    }, [token, doSubscribe]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            console.log('[WebSocket] Disconnecting...');
            clientRef.current.deactivate();
            clientRef.current = null;
            setConnected(false);
        }
    }, []);

    const subscribe = useCallback((topic, callback) => {
        if (!topic || !callback) {
            console.warn('[WebSocket] Invalid subscribe call: missing topic or callback');
            return () => { };
        }

        console.log(`[WebSocket] Subscribe requested for: ${topic}, connected: ${clientRef.current?.connected || false}`);

        // If already connected, subscribe immediately
        if (clientRef.current && clientRef.current.connected) {
            const subscription = doSubscribe(clientRef.current, topic, callback);
            if (subscription) {
                subscriptionsRef.current.set(topic, { callback, subscription });
                return () => {
                    console.log(`[WebSocket] Unsubscribing from: ${topic}`);
                    subscription.unsubscribe();
                    subscriptionsRef.current.delete(topic);
                };
            }
        } else {
            // Queue subscription for when connection is established
            console.log(`[WebSocket] Queueing subscription for: ${topic} (not connected yet)`);
            pendingSubscriptions.current.set(topic, callback);
        }

        // Return unsubscribe function
        return () => {
            console.log(`[WebSocket] Unsubscribing from: ${topic}`);
            const entry = subscriptionsRef.current.get(topic);
            if (entry && entry.subscription) {
                entry.subscription.unsubscribe();
            }
            subscriptionsRef.current.delete(topic);
            pendingSubscriptions.current.delete(topic);
        };
    }, [doSubscribe]);

    useEffect(() => {
        if (token) {
            connect();
        } else {
            disconnect();
        }
        return () => disconnect();
    }, [token, connect, disconnect]);

    return {
        connected,
        subscribe
    };
};

export default useWebSocket;
