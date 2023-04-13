import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Save a folder
 * @param agent { id, logo? }
 * @param document { name, url }
 * @returns document data object and session_key string
 */
export async function saveDocument(agent: { id: number; logo?: string }, name?: string) {
  const response = await axios.post(
    `/api/documents/${Cookies.get('cid')}`,
    {
      name,
      agent,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    Cookies.set('session_key', session_key);
    return record;
  }

  return response;
}

/**
 * Save a document
 * @param agent { id, logo? }
 * @param document { name, url }
 * @returns document data object and session_key string
 */
export async function saveDocumentUpload(document_id: number, url: string, file_name?: string) {
  const response = await axios.post(
    `/api/document-uploads/${Cookies.get('cid')}`,
    {
      url,
      file_name,
      document: document_id,
    },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    Cookies.set('session_key', session_key);
    return record;
  }

  return response;
}

/**
 * Retrieves all documents
 * @returns documents data object array and session_key string
 */
export async function retrieveDocuments() {
  const response = await axios.get(`/api/documents/${Cookies.get('cid')}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, documents } = response.data;
    Cookies.set('session_key', session_key);
    return documents;
  }

  return response;
}
