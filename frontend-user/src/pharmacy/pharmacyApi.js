const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Map backend medicine format to frontend format
const mapMedicine = (m) => ({
    id: m.id || m.index,
    name: m.name || m.product_name,
    baseName: m.name || m.product_name,
    brand: m.brand || '',
    category: m.category || '',
    subCategory: m.subCategory || m.sub_category || '',
    price: m.price || m.sale_price || 0,
    originalPrice: m.originalPrice || m.market_price || 0,
    image: m.image || m.image_url || `https://placehold.co/400x400/f3e8ff/6b21a8?text=${encodeURIComponent(m.name || '')}`,
    rating: m.rating || m.ratings || 4.0,
    stock: m.stock || 0,
    discount: m.discount || (
        m.market_price > m.sale_price
            ? Math.round(((m.market_price - m.sale_price) / m.market_price) * 100)
            : 0
    ),
    selectedWeight: 'Std',
    unitType: 'unit',
    perUnitSellingPrice: m.price || m.sale_price || 0,
    perUnitOriginalPrice: m.originalPrice || m.market_price || 0,
});

export const pharmacyApi = {
    // Search medicines
    searchMedicines: async (query) => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/medicines?search=${encodeURIComponent(query)}&limit=50`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            return data.map(mapMedicine);
        } catch (e) {
            console.error('Medicine search failed:', e);
            return [];
        }
    },

    // Get by category
    getMedicinesByCategory: async (category) => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/medicines?category=${encodeURIComponent(category)}&limit=200`);
            if (!res.ok) throw new Error('Category fetch failed');
            const data = await res.json();
            return data.map(mapMedicine);
        } catch (e) {
            console.error('Category medicines failed:', e);
            return [];
        }
    },

    // Get by sub_category
    getMedicinesBySubCategory: async (category, subCategory) => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/medicines?category=${encodeURIComponent(category)}&sub_category=${encodeURIComponent(subCategory)}&limit=100`);
            if (!res.ok) throw new Error('Subcategory fetch failed');
            const data = await res.json();
            return data.map(mapMedicine);
        } catch (e) {
            console.error('Subcategory medicines failed:', e);
            return [];
        }
    },

    // Get all categories
    getCategories: async () => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/categories`);
            if (!res.ok) throw new Error('Categories failed');
            return await res.json();
        } catch (e) {
            console.error('Categories failed:', e);
            return [];
        }
    },

    // Create order
    createOrder: async (orderData) => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            if (!res.ok) throw new Error('Order failed');
            return await res.json();
        } catch (e) {
            console.error('Order creation failed:', e);
            return null;
        }
    },

    // Get order history
    getOrders: async (userId) => {
        try {
            const res = await fetch(`${BASE_URL}/pharmacy/orders/${userId}`);
            if (!res.ok) throw new Error('Order history failed');
            return await res.json();
        } catch (e) {
            console.error('Order history failed:', e);
            return [];
        }
    },
};
