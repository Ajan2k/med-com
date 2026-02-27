import React, { createContext, useContext, useState } from 'react';

const PharmacyCartContext = createContext();

export const PharmacyCartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast({ message });
        setTimeout(() => setToast(null), 3500);
    };

    const updateQuantity = (product, qty) => {
        setCart(prev => {
            const key = `${product.id}`;
            if (qty <= 0) return prev.filter(p => `${p.id}` !== key);
            const idx = prev.findIndex(p => `${p.id}` === key);
            let newCart = [...prev];
            if (idx >= 0) {
                newCart[idx] = { ...newCart[idx], quantity: qty };
            } else {
                newCart = [...prev, { ...product, quantity: qty }];
                showToast(`Added ${product.name}`);
            }
            return newCart;
        });
    };

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((a, b) => a + (b.quantity || 0), 0);
    const cartTotal = cart.reduce((a, b) => a + (b.price * (b.quantity || 1)), 0);

    return (
        <PharmacyCartContext.Provider value={{
            cart, updateQuantity, clearCart,
            isCartOpen, setIsCartOpen,
            cartCount, cartTotal,
            toast, showToast,
        }}>
            {children}
        </PharmacyCartContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePharmacyCart = () => useContext(PharmacyCartContext);
