// const DEFAULT_PROD_URL = 'https://bright-stage-backend.vercel.app';
const DEFAULT_PROD_URL = 'http://localhost:5002';

export const BACKEND_URL = DEFAULT_PROD_URL;
export const API_URL = `${BACKEND_URL}/api`;

export const CONFIG = {
    BACKEND_URL,
    API_URL,
    SOCKET_URL: BACKEND_URL
};

export default CONFIG;
