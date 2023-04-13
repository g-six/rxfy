export interface DocumentDataModel {
  id: number;
  attributes: {
    name?: string;
  };
}

export interface DocumentUploadDataModel {
  id: number;
  document: DocumentDataModel;
}
export interface DocumentInterface {
  id: string;
  attributes: {
    url: string;
    [key: string]: string;
  };
}
export interface DocumentsFolderInterface {
  name: string;
  agent: {
    [key: string]: string;
  };
  document_uploads: {
    data: DocumentInterface[];
  };
  id: '4';
}
