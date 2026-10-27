// API base URL - uses Vite proxy in dev, same origin in production
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Demo mode flag (overridden by backend response)
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE !== 'false';
