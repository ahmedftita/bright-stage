const isDev = import.meta.env.DEV;

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
    isDev 
        ? 'http://localhost:5002' 
        : 'https://bright-stage-backend.vercel.app'
);

export const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;

export default {
    BACKEND_URL,
    API_URL
};
