import { MLSProperty } from './property';
import { SavedSearchInput } from './saved-search';
import { ImagePreview } from '@/hooks/useFormEvent';

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
  MyHomeAlertsModal = 'my-home-alerts-modal',
  MyHomeAlertsForm = 'my-home-alerts-form',
  MyHomeAlertsFormReset = 'my-home-alerts-form-reset',
  GenericEvent = 'generic-event',
  TogglePhotoSliderModal = 'photo-slider-modal',
  PropertyGalleryModal = 'property-gallery-modal',
  PrivateListingForm = 'event-private-listing-form',
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
  onClose?: () => void;
  message?: string;
  category?: NotificationCategory;
  property?: MLSProperty;
  mls_id?: string;
  metadata?: any;
  alertData?: SavedSearchInput;
  reload?: boolean;
  photos?: string[];
}
export const tabEventMapping: { [key: string]: Events } = {
  'indiv-view': Events.SavedItemsIndivTab,
  'map-view': Events.SavedItemsMapTab,
  // 'compare-view': Events.SavedItemsCompareTab,
  // default: Events.SavedItemsCompareTab,
};

// FORM EVENTS
export type FormData = {
  // Handling data
  submit?: boolean; // if true, will trigger form submission
  broadcast?: boolean; // if true, means that this event is a notification for consumers
};

export interface PrivateListingData extends FormData {
  // Tab AI
  prompt?: string;
  generatedPrompt?: object;
  generatedAddress?: object;
  photos?: ImagePreview[];

  // Address
  // ...
}
