import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Save a document
 * @param number document_id (folder)
 * @param file File
 * @returns document data object and session_key string
 */
export async function saveDocumentUpload(document_id: number, file: { file: File; name: string; size: number; type: string }) {
  const response = await axios.post(
    `/api/upload`,
    {
      document: document_id,
      file,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { session_key, ...record } = response.data;
  if (session_key) {
    Cookies.set('session_key', session_key);
  } else {
    console.log('Warning: no new session key has been issued in saveDocumentUpload()');
  }

  return record;
}

/**
 * Generic file uploader
 * @param number document_id (folder)
 * @param file File
 * @returns document data object and session_key string
 */
export async function getUploadUrl(file_full_path: string, file: File) {
  const response = await axios.post(
    `/api/upload`,
    {
      file_full_path,
      type: file.type,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { session_key, ...record } = response.data;
  if (session_key) {
    Cookies.set('session_key', session_key);
  } else {
    console.log('Warning: no new session key has been issued in getUploadUrl()');
  }

  return record;
}

/**
 * Generic file uploader
 * @param object_path S3 Object path e.g. uploads/file.txt
 * @returns document data object and session_key string
 */
export async function invalidateAgentFile(Items: string[]) {
  const response = await axios.put(
    `/api/upload`,
    {
      Items,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { session_key, ...record } = response.data;
  if (session_key) {
    Cookies.set('session_key', session_key);
  } else {
    console.log('Warning: no new session key has bee issued in invalidateAgentFile()');
  }

  return record;
}
