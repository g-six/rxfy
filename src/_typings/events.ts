export enum Events {
  Login = 'event-login',
  Loading = 'event-loading',
  ResetPassword = 'event-reset-password',
  SignUp = 'event-signup',
  SystemNotification = 'system-notification',
  HomeAlertDismiss = 'event-home-alert-dismiss',
  HomeAlertSuccess = 'event-home-alert-success',
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
  category?: 'error' | 'success';
}
