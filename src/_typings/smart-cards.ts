export interface SmartCardBaseModel {
  name: string;
  title: string;
}
export interface SmartCardOutput extends SmartCardBaseModel {
  logo_url?: string;
  realtor: number;
}

export interface SmartCardInput extends SmartCardBaseModel {
  logo: File;
}
