/* --- ARCHIVO: lib/gdrive.ts (Versión Datos Ocultos) --- */

import { FILE_NAME } from "./config";

/**
 * Cierra la sesión si el token ha expirado (Error 401)
 */
const logoutForced = () => {
  localStorage.removeItem('gdrive_token');
  localStorage.removeItem('user_name');
  if (typeof window !== 'undefined') {
    window.location.href = "/";
  }
};

/**
 * Busca el archivo JSON de la base de datos en la carpeta OCULTA de la app
 */
export const getDriveFile = async (token: string) => {
  try {
    // IMPORTANTE: añadimos 'spaces=appDataFolder' para buscar en el espacio oculto
    const url = `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&spaces=appDataFolder&fields=files(id,name)`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) { 
      logoutForced(); 
      return null; 
    }

    const data = await res.json();

    if (data.files && data.files.length > 0) {
      const fileId = data.files[0].id;
      // Descargamos el contenido del archivo
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (contentRes.status === 401) { 
        logoutForced(); 
        return null; 
      }

      const jsonData = await contentRes.json();
      return { id: fileId, data: jsonData };
    }

    // Si no existe, devolvemos una estructura vacía
    return { id: null, data: { gastos: [], lista: [] } };
  } catch (e) {
    console.error("Error al obtener archivo de Drive:", e);
    return { id: null, data: { gastos: [], lista: [] } };
  }
};

/**
 * Obtiene una imagen (blob) por su ID para mostrarla en el visor
 */
export const getDriveFileBlob = async (token: string, fileId: string) => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      logoutForced();
      return null;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error al obtener imagen de Drive:", e);
    return null;
  }
};

/**
 * Sube una imagen (ticket) a la carpeta OCULTA de la app
 */
export const uploadImageToDrive = async (token: string, base64Image: string) => {
  // Metadata: Definimos que el padre es 'appDataFolder' para que sea invisible
  const metadata = { 
    name: `ticket_${Date.now()}.jpg`, 
    mimeType: 'image/jpeg',
    parents: ['appDataFolder'] 
  };

  const base64Data = base64Image.split(',')[1];
  const blob = await (await fetch(`data:image/jpeg;base64,${base64Data}`)).blob();

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  const data = await res.json();
  return data.id;
};

/**
 * Guarda o actualiza el archivo JSON principal en la carpeta OCULTA
 */
export const saveDriveFile = async (token: string, content: any, fileId?: string | null) => {
  const metadata: any = { 
    name: FILE_NAME, 
    mimeType: 'application/json' 
  };

  // Si el archivo es nuevo (POST), le asignamos la carpeta oculta como padre
  if (!fileId) {
    metadata.parents = ['appDataFolder'];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` 
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, { 
    method: fileId ? 'PATCH' : 'POST', 
    headers: { Authorization: `Bearer ${token}` }, 
    body: form 
  });

  return await res.json();
};