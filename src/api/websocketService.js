import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Get the WebSocket URL from the API base URL
const getWsUrl = () => {
    const apiUrl = 'https://tmmsystem-sep490g143-production.up.railway.app';
    return `${apiUrl}/ws`;
};

class WebSocketService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.subscribers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        if (this.client && this.isConnected) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const wsUrl = getWsUrl();

            this.client = new Client({
                webSocketFactory: () => new SockJS(wsUrl),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,

                onConnect: () => {
                    console.log('[WebSocket] Connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    // Resubscribe to all topics after reconnect
                    this.subscribers.forEach((callbacks, topic) => {
                        this._subscribe(topic);
                    });

                    resolve();
                },

                onDisconnect: () => {
                    console.log('[WebSocket] Disconnected');
                    this.isConnected = false;
                },

                onStompError: (frame) => {
                    console.error('[WebSocket] STOMP error:', frame.headers['message']);
                    reject(new Error(frame.headers['message']));
                },
            });

            this.client.activate();
        });
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
            this.subscribers.clear();
        }
    }

    _subscribe(topic) {
        if (!this.client || !this.isConnected) return null;

        return this.client.subscribe(topic, (message) => {
            const data = JSON.parse(message.body);
            const callbacks = this.subscribers.get(topic) || [];
            callbacks.forEach(callback => callback(data));
        });
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic).push(callback);

        // If already connected, subscribe immediately
        if (this.isConnected) {
            this._subscribe(topic);
        }

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(topic) || [];
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    // Subscribe to order updates
    subscribeToOrders(callback) {
        return this.subscribe('/topic/orders', callback);
    }

    // Subscribe to stage updates
    subscribeToStages(callback) {
        return this.subscribe('/topic/stages', callback);
    }

    // Subscribe to defect updates
    subscribeToDefects(callback) {
        return this.subscribe('/topic/defects', callback);
    }
}

// Singleton instance
const websocketService = new WebSocketService();
export default websocketService;
