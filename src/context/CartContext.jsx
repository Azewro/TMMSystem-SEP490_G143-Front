import React, { createContext, useContext, useState, useEffect } from 'react';
import { productService } from '../api/productService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('cartItems');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Could not parse cart items from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Validate cart items on mount
  useEffect(() => {
    const validateCart = async () => {
      try {
        const products = await productService.getAllProducts();
        if (products && Array.isArray(products)) {
          const validProductIds = new Set(products.map(p => p.id));

          setCartItems(prevItems => {
            const validItems = prevItems.filter(item => validProductIds.has(item.id));
            // Only update if items were removed to avoid unnecessary re-renders
            if (validItems.length !== prevItems.length) {
              console.log(`Removed ${prevItems.length - validItems.length} stale items from cart.`);
              return validItems;
            }
            return prevItems;
          });
        }
      } catch (error) {
        console.error("Failed to validate cart items:", error);
      }
    };

    validateCart();
  }, []);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // If item exists, update its quantity (add 100 more)
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 100 } : item
        );
      } else {
        // If item doesn't exist, add it with quantity 100 (minimum for RFQ)
        return [...prevItems, { ...product, quantity: 100 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const newQuantity = Math.max(1, quantity); // Ensure quantity is at least 1
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Remove multiple items by their IDs (for partial cart submission)
  const removeMultipleFromCart = (productIds) => {
    const idsToRemove = new Set(productIds);
    setCartItems(prevItems => prevItems.filter(item => !idsToRemove.has(item.id)));
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    removeMultipleFromCart,
    itemCount: cartItems.length
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
