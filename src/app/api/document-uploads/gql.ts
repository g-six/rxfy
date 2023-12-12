export const gql_delete_doc_upload = `mutation DeleteDocumentUpload ($id: ID!) {
    record: deleteDocumentUpload(id: $id) {
      data {
        id
        attributes {
          file_name
          url
          document {
            data {
              id
            }
          }
        }
      }
    }
  }`;
