import { FILE_NAME } from "./config";
import { AppDB } from "./types";

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('gdrive_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    }).then(r => r.json());

    if (res.access_token) {
      localStorage.setItem('gdrive_token', res.access_token);
      return res.access_token;
    }
  } catch (error) {
    console.error("Error refreshing token", error);
  }
  return null;
};

const logoutForced = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gdrive_token');
    localStorage.removeItem('gdrive_refresh_token');
    localStorage.removeItem('user_name');
    window.location.href = "/";
  }
};

async function fetchWithRetry(url: string, options: RequestInit, bodyFactory?: () => any, retries = 1): Promise<Response> {
  try {
    const currentOptions = { ...options };
    if (bodyFactory) {
      currentOptions.body = bodyFactory();
    }
    const res = await fetch(url, currentOptions);
    
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        };
        if (bodyFactory) {
            newOptions.body = bodyFactory();
        }
        return fetch(url, newOptions);
      } else {
        logoutForced();
        throw new Error("Sesión expirada");
      }
    }

    if (!res.ok && retries > 0) {
      return fetchWithRetry(url, options, bodyFactory, retries - 1);
    }
    return res;
  } catch (err) {
    if (retries > 0) return fetchWithRetry(url, options, bodyFactory, retries - 1);
    throw err;
  }
}

export const getDriveFile = async (token: string): Promise<{ id: string | null; data: AppDB } | null> => {
  try {
    const url = `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&spaces=appDataFolder&fields=files(id,name)`;
    
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const fileId = data.files[0].id;
      const contentRes = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const jsonData = await contentRes.json();
      if (!jsonData.customCategories) jsonData.customCategories = [];
      return { id: fileId, data: jsonData };
    }

    return { id: null, data: { gastos: [], lista: [], customCategories: [] } };
  } catch (e) {
    console.error("Error al obtener archivo de Drive:", e);
    return { id: null, data: { gastos: [], lista: [], customCategories: [] } };
  }
};

export const getDriveFileBlob = async (token: string, fileId: string): Promise<string | null> => {
  try {
    const res = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error al obtener imagen de Drive:", e);
    return null;
  }
};

export const uploadImageToDrive = async (token: string, base64Image: string): Promise<string> => {
  const metadata = { 
    name: `ticket_${Date.now()}.jpg`, 
    mimeType: 'image/jpeg',
    parents: ['appDataFolder'] 
  };

  const createFormData = () => {
    const base64Data = base64Image.split(',')[1];
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: 'image/jpeg' });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    return form;
  };

  const res = await fetchWithRetry(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", 
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    createFormData
  );

  const data = await res.json();
  if (!data.id) throw new Error("Error al subir imagen");
  return data.id;
};

export const saveDriveFile = async (token: string, content: AppDB, fileId?: string | null) => {
  const metadata: any = { 
    name: FILE_NAME, 
    mimeType: 'application/json' 
  };

  if (!fileId) {
    metadata.parents = ['appDataFolder'];
  }

  const createFormData = () => {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));
    return form;
  };

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` 
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetchWithRetry(
    url, 
    { method: fileId ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${token}` } },
    createFormData
  );

  if (!res.ok) throw new Error("Error al guardar en Drive");
  return await res.json();
};