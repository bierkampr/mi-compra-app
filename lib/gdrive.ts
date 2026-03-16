import { FILE_NAME } from "./config";

const logoutForced = () => {
  localStorage.removeItem('gdrive_token');
  localStorage.removeItem('user_name');
  window.location.href = "/";
};

export const getDriveFile = async (token: string) => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { logoutForced(); return null; }
    const data = await res.json();
    if (data.files?.length > 0) {
      const content = await fetch(`https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (content.status === 401) { logoutForced(); return null; }
      return { id: data.files[0].id, data: await content.json() };
    }
    return { id: null, data: { gastos: [], lista: [] } };
  } catch (e) { return { id: null, data: { gastos: [], lista: [] } }; }
};

export const getDriveFileBlob = async (token: string, fileId: string) => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) { return null; }
};

export const uploadImageToDrive = async (token: string, base64Image: string) => {
  const metadata = { name: `ticket_${Date.now()}.jpg`, mimeType: 'image/jpeg' };
  const base64Data = base64Image.split(',')[1];
  const blob = await (await fetch(`data:image/jpeg;base64,${base64Data}`)).blob();
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  const data = await res.json();
  return data.id;
};

export const saveDriveFile = async (token: string, content: any, fileId?: string | null) => {
  const metadata = { name: FILE_NAME, mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));
  const url = fileId ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart` : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const res = await fetch(url, { method: fileId ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return await res.json();
};