export enum Events {
  Login = 'event-login',
  Loading = 'event-loading',
  ResetPassword = 'event-reset-password',
  UpdatePassword = 'event-update-password',
  SignUp = 'event-signup',
  SaveAccountChanges = 'event-save-acct-changes',
  SystemNotification = 'system-notification',
  HomeAlertDismiss = 'event-home-alert-dismiss',
  HomeAlertSuccess = 'event-home-alert-success',
  ContactFormShow = 'event-contact-form-show',
  CreateDocFolderShow = 'event-create-docfolder-show',
  DocFolderShow = 'event-docfolder-show',
  LovedItem = 'event-loved-item',
  //ContactFormSubmit = 'event-contact-form-submit',
}

export enum NotificationCategory {
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
  Info = 'info',
}

export interface EventsData {
  key?: number;
  clicked?: string;
  show?: boolean;
  timeout?: number;
  time?: number;
  message?: string;
  category?: NotificationCategory;
}
