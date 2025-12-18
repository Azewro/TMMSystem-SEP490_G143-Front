import React, { createContext, useContext, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const { user } = useAuth();
    // Use user ID or token as connection trigger. 
    // Here we use user?.id to ensure we only connect when logged in.
    const token = sessionStorage.getItem('token');

    const { connected, subscribe } = useWebSocket(token);

    // Provide subscribe method globally
    const value = {
        connected,
        subscribe,
        userId: user?.id
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
