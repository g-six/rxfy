export enum Events {
  Login = 'event-login',
  Loading = 'event-loading',
  ResetPassword = 'event-reset-password',
  SignUp = 'event-signup',
  SaveAccountChanges = 'event-save-acct-changes',
  SystemNotification = 'system-notification',
  HomeAlertDismiss = 'event-home-alert-dismiss',
  HomeAlertSuccess = 'event-home-alert-success',
  HomeAlertError = 'event-home-alert-error',
  ContactFormShow = 'event-contact-form-show',
  ContactFormSubmit = 'event-contact-form-submit',
}

export enum NotificationCategory {
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
  Info = 'info',
}

export interface EventsData {
  clicked?: string;
  show?: boolean;
  time?: number;
  message?: string;
  category?: NotificationCategory;
}
