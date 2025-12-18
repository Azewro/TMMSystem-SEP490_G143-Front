import { useRef, useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = '/ws'; // Backend registers this endpoint

/**
 * Hook to manage a single WebSocket connection using STOMP over SockJS.
 */
const useWebSocket = (token) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);
    const subscriptions = useRef(new Map());

    const connect = useCallback(() => {
        if (clientRef.current && clientRef.current.active) {
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('Connected to WebSocket');
            setConnected(true);

            // Re-subscribe to existing topics on reconnect
            subscriptions.current.forEach((callback, topic) => {
                client.subscribe(topic, (message) => {
                    callback(JSON.parse(message.body));
                });
            });
        };

        client.onStompError = (frame) => {
            console.error('STOMP error', frame.headers['message']);
            setConnected(false);
        };

        client.onDisconnect = () => {
            console.log('Disconnected from WebSocket');
            setConnected(false);
        };

        client.activate();
        clientRef.current = client;
    }, [token]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.deactivate();
            clientRef.current = null;
            setConnected(false);
        }
    }, []);

    const subscribe = useCallback((topic, callback) => {
        if (!topic || !callback) return;

        // Save subscription for reconnection
        subscriptions.current.set(topic, callback);

        if (clientRef.current && clientRef.current.connected) {
            const subscription = clientRef.current.subscribe(topic, (message) => {
                callback(JSON.parse(message.body));
            });
            return () => {
                subscription.unsubscribe();
                subscriptions.current.delete(topic);
            };
        }
    }, []);

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
