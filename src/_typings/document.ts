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
