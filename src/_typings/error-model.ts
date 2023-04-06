export interface ErrorModel {
  message: string;
  extensions: {
    error: {
      name: string;
      message?: string;
      details?: {
        errors: {
          path: string[];
          message: string;
        }[];
      };
    };
  };
}
