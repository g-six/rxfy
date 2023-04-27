import { MLSProperty } from './property';

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
  ToggleUserMenu = 'event-user-menu',
  SavedItemsIndivTab = 'saved-items-individual-tab',
  SavedItemsCompareTab = 'saved-items-compare-tab',
  SavedItemsMapTab = 'saved-items-map-tab',
  CompareFiltersModal = 'compare-filters-modal',
  //ContactFormSubmit = 'event-contact-form-submit',
}

export enum NotificationCategory {
  ERROR = 'error',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
}
export enum NotificationMessages {
  DOC_UPLOAD_COMPLETE = 'Document upload complete.',
}

export interface EventsData {
  key?: number;
  clicked?: string;
  show?: boolean;
  timeout?: number;
  time?: number;
  message?: string;
  category?: NotificationCategory;
  property?: MLSProperty;
  mls_id?: string;
  metadata?: any;
}
export const tabEventMapping: { [key: string]: Events } = {
  'indiv-view': Events.SavedItemsIndivTab,
  'map-view': Events.SavedItemsMapTab,
  // 'compare-view': Events.SavedItemsCompareTab,
  // default: Events.SavedItemsCompareTab,
};
