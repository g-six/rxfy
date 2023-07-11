import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Save a folder
 * @param object agent { id, logo? }
 * @param string document name
 * @returns document data object and session_key string
 */
export async function createFolder(agent: { id: number; logo?: string }, name?: string, agent_customer?: string) {
  const response = await axios.post(
    `/api/${agent_customer ? `agents/customer/${agent_customer}/` : ''}documents`,
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
    if (session_key) Cookies.set('session_key', session_key);
    return record;
  }

  return response;
}

/**
 * Save a document
 * @param number document_id (folder)
 * @param file File
 * @returns document data object and session_key string
 */
export async function saveDocumentUpload(document_id: number, file: { file: File; name: string; size: number; type: string }) {
  const { name, size, type } = file;
  const response = await axios.post(
    `/api/document-uploads`,
    {
      document: document_id,
      upload: {
        name,
        size,
        type,
      },
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

/**
 * Retrieves all documents
 * @returns documents data object array and session_key string
 */
export async function getDocumentSignedUrl(file_name: string) {
  const response = await axios.get(`/api/document-uploads/${encodeURIComponent(file_name)}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, url } = response.data;
    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has been issued in getDocumentSignedUrl()');
    }
    return url;
  }

  return response;
}

/**
 * Remove a folder
 * @param number id (document.id)
 * @param url string
 * @returns document data object and session_key string
 */
export async function removeDocument(id: number) {
  const response = await axios.delete(`/api/documents/${id}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in removeDocument()');
    }
    return record;
  }

  return response;
}

/**
 * Remove a document
 * @param number id (document_upload.id)
 * @param url string
 * @returns document data object and session_key string
 */
export async function removeDocumentUpload(id: number) {
  const response = await axios.delete(`/api/document-uploads/${id}`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, ...record } = response.data;
    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in removeDocumentUpload()');
    }
    return record;
  }

  return response;
}

/**
 * Retrieves all documents
 * @returns documents data object array and session_key string
 */
export async function retrieveDocuments(agent_customer_id?: number) {
  const response = await axios.get(`/api/${agent_customer_id ? `agents/customer/${agent_customer_id}/` : ''}documents`, {
    headers: {
      Authorization: `Bearer ${Cookies.get('session_key')}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 200) {
    const { session_key, documents } = response.data;

    if (session_key) {
      Cookies.set('session_key', session_key);
    } else {
      console.log('Warning: no new session key has bee issued in retrieveDocuments()');
    }

    return documents;
  }

  return response;
}
