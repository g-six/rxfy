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
    console.log('Warning: no new session key has bee issued in saveDocumentUpload()');
  }

  return record;
}
