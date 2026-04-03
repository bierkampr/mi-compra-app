/* --- ARCHIVO: lib/tokenStore.ts --- */

/**
 * Utility for secure handling of Google OAuth2 tokens.
 * Access Token is stored in sessionStorage (tab-scoped, short-lived).
 * Refresh Token is stored in localStorage but encoded.
 */

const REFRESH_TOKEN_KEY = 'gdrive_refresh_token_enc';
const ACCESS_TOKEN_KEY = 'gdrive_access_token';
const USER_NAME_KEY = 'user_name';
const AI_PERMISSION_KEY = 'mi_compra_ai_granted';

/**
 * Encodes a string to Base64 (simple obfuscation for localStorage).
 */
const encode = (val: string) => typeof btoa !== 'undefined' ? btoa(val) : val;

/**
 * Decodes a Base64 string.
 */
const decode = (val: string) => typeof atob !== 'undefined' ? atob(val) : val;

export const tokenStore = {
    setTokens: (accessToken: string, refreshToken?: string, name?: string) => {
        if (typeof window === 'undefined') return;
        
        sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, encode(refreshToken));
        }
        if (name) {
            localStorage.setItem(USER_NAME_KEY, name);
        }
    },

    getAccessToken: () => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken: () => {
        if (typeof window === 'undefined') return null;
        const enc = localStorage.getItem(REFRESH_TOKEN_KEY);
        // Fallback to old key for migration if needed
        if (!enc) {
            const old = localStorage.getItem('gdrive_refresh_token');
            if (old) {
                localStorage.setItem(REFRESH_TOKEN_KEY, encode(old));
                localStorage.removeItem('gdrive_refresh_token');
                return old;
            }
            return null;
        }
        return decode(enc);
    },

    getUserName: () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(USER_NAME_KEY);
    },

    clearTokens: () => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_NAME_KEY);
        localStorage.removeItem(AI_PERMISSION_KEY);
        // Clean up legacy keys
        localStorage.removeItem('gdrive_token');
        localStorage.removeItem('gdrive_refresh_token');
    },

    setAiPermission: (granted: boolean) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(AI_PERMISSION_KEY, granted ? 'true' : 'false');
    },

    isAiPermissionGranted: () => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(AI_PERMISSION_KEY) === 'true';
    }
};
