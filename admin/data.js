import { products } from '../src/products';

export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
export const initialData = {
  products: products.map((p, i) => ({ ...p, sku: `RNG-${String(p.id).padStart(4, '0')}`, stock: [42, 18, 7, 34, 0, 56, 12, 8, 29, 5, 23, 16][i], status: i === 4 ? 'Draft' : 'Active', sizes: 'S, M, L, XL', description: p.fabric, fabric: p.fabric.replaceAll('Â', '') })),
  orders: [
    { id: 'RNG-1048', customer: 'Aanya Sharma', email: 'aanya@example.com', city: 'Jaipur', address: '24, Pink City Road, Jaipur, Rajasthan 302001', productId: 1, qty: 1, total: 6495, date: '2026-09-19', status: 'Processing', payment: 'Paid', method: 'UPI' },
    { id: 'RNG-1047', customer: 'Meera Kapoor', email: 'meera@example.com', city: 'New Delhi', address: '18, Green Park, New Delhi 110016', productId: 2, qty: 1, total: 7995, date: '2026-09-19', status: 'Pending', payment: 'Pending', method: 'Cash on delivery' },
    { id: 'RNG-1046', customer: 'Ishita Patel', email: 'ishita@example.com', city: 'Ahmedabad', address: '7, Lotus Avenue, Ahmedabad, Gujarat 380015', productId: 3, qty: 1, total: 8495, date: '2026-09-18', status: 'Shipped', payment: 'Paid', method: 'Card' },
    { id: 'RNG-1045', customer: 'Riya Verma', email: 'riya@example.com', city: 'Mumbai', address: '42, Hill Road, Mumbai, Maharashtra 400050', productId: 4, qty: 2, total: 12190, date: '2026-09-18', status: 'Delivered', payment: 'Paid', method: 'UPI' },
    { id: 'RNG-1044', customer: 'Kavya Nair', email: 'kavya@example.com', city: 'Bengaluru', address: '10, Garden Street, Bengaluru, Karnataka 560038', productId: 6, qty: 1, total: 1895, date: '2026-09-17', status: 'Delivered', payment: 'Paid', method: 'Card' },
    { id: 'RNG-1043', customer: 'Sara Khan', email: 'sara@example.com', city: 'Lucknow', address: '8, Hazratganj, Lucknow, Uttar Pradesh 226001', productId: 7, qty: 1, total: 4195, date: '2026-09-16', status: 'Cancelled', payment: 'Refunded', method: 'UPI' },
    { id: 'RNG-1042', customer: 'Anika Rao', email: 'anika@example.com', city: 'Hyderabad', address: '21, Jubilee Hills, Hyderabad, Telangana 500033', productId: 8, qty: 1, total: 8395, date: '2026-09-15', status: 'Delivered', payment: 'Paid', method: 'Card' },
    { id: 'RNG-1041', customer: 'Diya Singh', email: 'diya@example.com', city: 'Chandigarh', address: '32, Sector 17, Chandigarh 160017', productId: 9, qty: 1, total: 2195, date: '2026-09-14', status: 'Delivered', payment: 'Paid', method: 'UPI' },
  ],
  customers: ['Aanya Sharma', 'Meera Kapoor', 'Ishita Patel', 'Riya Verma', 'Kavya Nair', 'Sara Khan', 'Anika Rao', 'Diya Singh'].map((name, i) => ({ id: `CUS-${101 + i}`, name, email: `${name.split(' ')[0].toLowerCase()}@example.com`, phone: `+91 90000 0000${i}`, city: ['Jaipur', 'New Delhi', 'Ahmedabad', 'Mumbai', 'Bengaluru', 'Lucknow', 'Hyderabad', 'Chandigarh'][i], status: i % 3 === 0 ? 'VIP' : 'Active', joined: '2026-09-01' })),
  categories: [
    { id: 'CAT-1', name: 'Sarees', description: 'Timeless drapes, modern stories.', image: 'yellow', status: 'Active' },
    { id: 'CAT-2', name: 'Lehengas', description: 'Made for your main-character moments.', image: 'floral', status: 'Active' },
    { id: 'CAT-3', name: 'Kurta sets', description: 'Everyday ease. Extraordinary details.', image: 'emerald', status: 'Active' },
  ],
  returns: [
    { id: 'RET-201', order: 'RNG-1045', customer: 'Riya Verma', reason: 'Size exchange', amount: 6095, status: 'Requested', date: '2026-09-19' },
    { id: 'RET-200', order: 'RNG-1043', customer: 'Sara Khan', reason: 'Order cancelled', amount: 4195, status: 'Refunded', date: '2026-09-17' },
  ],
  coupons: [
    { id: 'CPN-1', code: 'FESTIVE15', type: 'Percentage', value: 15, minimum: 2999, uses: 28, expiry: '2026-10-31', status: 'Active' },
    { id: 'CPN-2', code: 'HELLO500', type: 'Fixed amount', value: 500, minimum: 4999, uses: 16, expiry: '2026-12-31', status: 'Active' },
    { id: 'CPN-3', code: 'MONSOON10', type: 'Percentage', value: 10, minimum: 1999, uses: 52, expiry: '2026-08-31', status: 'Expired' },
  ],
  campaigns: [
    { id: 'CAM-1', name: 'The festive edit', channel: 'Email', audience: 'All subscribers', date: '2026-09-25', status: 'Scheduled' },
    { id: 'CAM-2', name: 'A little colour, just for you', channel: 'Email', audience: 'VIP customers', date: '2026-09-12', status: 'Sent' },
    { id: 'CAM-3', name: 'Your wishlist is waiting', channel: 'SMS', audience: 'All subscribers', date: '2026-09-30', status: 'Draft' },
  ],
  reviews: [
    { id: 'REV-1', customer: 'Aanya Sharma', product: 'Sunehri Yellow Embroidered Saree', rating: 5, comment: 'Even more beautiful in person. The embroidery is lovely!', status: 'Published' },
    { id: 'REV-2', customer: 'Riya Verma', product: 'Gul Terracotta Floral Saree', rating: 4, comment: 'Beautiful colour and lovely fabric. Arrived on time.', status: 'Pending' },
    { id: 'REV-3', customer: 'Kavya Nair', product: 'Emerald Swirl Tunic Set', rating: 5, comment: 'So comfortable. My new everyday favourite.', status: 'Published' },
  ],
  content: [
    { id: 'PAGE-1', title: 'Find your festive favourite', type: 'Homepage banner', body: 'Indian wear that feels as special as you are.', status: 'Published' },
    { id: 'PAGE-2', title: 'Our story', type: 'Page', body: 'Rooted in tradition. Made for today. Rang celebrates every shade of you.', status: 'Published' },
    { id: 'PAGE-3', title: 'Shipping & returns', type: 'Policy', body: 'Dispatch within 24–48 hours. Complimentary shipping above ₹2,999.', status: 'Published' },
    { id: 'PAGE-4', title: 'The wedding guest edit', type: 'Blog post', body: 'Thoughtful outfits for every celebration on your calendar.', status: 'Draft' },
  ],
  shipping: [
    { id: 'SHP-1', name: 'Standard delivery', zone: 'All India', rate: 99, threshold: 2999, estimate: '4–7 business days', status: 'Active' },
    { id: 'SHP-2', name: 'Express delivery', zone: 'Metro cities', rate: 199, threshold: 9999, estimate: '1–3 business days', status: 'Active' },
  ],
  settings: { storeName: 'Rang', email: 'hello@rang.example', phone: '+91 90000 12345', address: 'Jaipur, Rajasthan, India', currency: 'INR', timezone: 'Asia/Kolkata', tax: 5, taxIncluded: true, orderEmails: true, stockAlerts: true, reviewAlerts: false, adminName: 'Nishant', adminEmail: 'cloath@gmail.com' },
};

export const entityConfigs = {
  categories: { label: 'category', fields: [['name', 'Category name'], ['description', 'Description', 'textarea'], ['image', 'Cover image', 'image'], ['status', 'Status', ['Active', 'Draft']]] },
  customers: { label: 'customer', fields: [['name', 'Full name'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['city', 'City'], ['status', 'Customer group', ['Active', 'VIP', 'Inactive']]] },
  coupons: { label: 'coupon', fields: [['code', 'Coupon code'], ['type', 'Discount type', ['Percentage', 'Fixed amount']], ['value', 'Discount value', 'number'], ['minimum', 'Minimum order (₹)', 'number'], ['expiry', 'Expiry date', 'date'], ['status', 'Status', ['Active', 'Paused', 'Expired']]] },
  campaigns: { label: 'campaign', fields: [['name', 'Campaign name'], ['channel', 'Channel', ['Email', 'SMS']], ['audience', 'Audience', ['All subscribers', 'VIP customers']], ['date', 'Scheduled date', 'date'], ['status', 'Status', ['Draft', 'Scheduled', 'Sent']]] },
  content: { label: 'content', fields: [['title', 'Title'], ['type', 'Content type', ['Page', 'Homepage banner', 'Policy', 'Blog post']], ['body', 'Content', 'textarea'], ['status', 'Status', ['Draft', 'Published']]] },
  shipping: { label: 'shipping method', fields: [['name', 'Method name'], ['zone', 'Delivery zone'], ['rate', 'Delivery fee (₹)', 'number'], ['threshold', 'Free delivery above (₹)', 'number'], ['estimate', 'Delivery estimate'], ['status', 'Status', ['Active', 'Paused']]] },
};
