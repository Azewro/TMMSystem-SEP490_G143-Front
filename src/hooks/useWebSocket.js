import { useState, useEffect, useCallback } from 'react';
import websocketService from '../api/websocketService';

/**
 * React hook for WebSocket real-time updates.
 * 
 * @param {Object} options - Options
 * @param {Function} options.onOrderUpdate - Callback when order updates
 * @param {Function} options.onStageUpdate - Callback when stage updates
 * @param {Function} options.onDefectUpdate - Callback when defect updates
 * @param {boolean} options.autoConnect - Auto connect on mount (default: true)
 * @returns {Object} { isConnected, connect, disconnect }
 */
export const useWebSocket = (options = {}) => {
    const {
        onOrderUpdate,
        onStageUpdate,
        onDefectUpdate,
        autoConnect = true,
    } = options;

    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(async () => {
        try {
            await websocketService.connect();
            setIsConnected(true);
        } catch (error) {
            console.error('[useWebSocket] Connection failed:', error);
            setIsConnected(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        websocketService.disconnect();
        setIsConnected(false);
    }, []);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            // Don't disconnect on unmount - keep connection for other components
        };
    }, [autoConnect, connect]);

    // Subscribe to order updates
    useEffect(() => {
        if (!onOrderUpdate) return;

        const unsubscribe = websocketService.subscribeToOrders((data) => {
            console.log('[WebSocket] Order update received:', data);
            onOrderUpdate(data);
        });

        return unsubscribe;
    }, [onOrderUpdate]);

    // Subscribe to stage updates
    useEffect(() => {
        if (!onStageUpdate) return;

        const unsubscribe = websocketService.subscribeToStages((data) => {
            console.log('[WebSocket] Stage update received:', data);
            onStageUpdate(data);
        });

        return unsubscribe;
    }, [onStageUpdate]);

    // Subscribe to defect updates
    useEffect(() => {
        if (!onDefectUpdate) return;

        const unsubscribe = websocketService.subscribeToDefects((data) => {
            console.log('[WebSocket] Defect update received:', data);
            onDefectUpdate(data);
        });

        return unsubscribe;
    }, [onDefectUpdate]);

    return {
        isConnected,
        connect,
        disconnect,
    };
};

export default useWebSocket;
