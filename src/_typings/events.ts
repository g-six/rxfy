import { MLSProperty } from './property';
import { SavedSearchInput } from './saved-search';
import { ImagePreview } from '@/hooks/useFormEvent';
import { ValueInterface } from '@/_typings/ui-types';

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
  LoadUserSession = 'load-session',
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
  user?: unknown;
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
  subscribe?: boolean; // if true, means that ew have a new consumer of this form data
};

export interface PrivateListingData extends FormData {
  // Tab AI
  prompt?: string;
  generatedPrompt?: object;
  generatedAddress?: {
    address?: string;
    city?: string;
    state_province?: string;
    search?: string;
  };
  photos?: ImagePreview[];

  // Address
  neighbourhood?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
  address_string?: string;

  // Home Summary
  asking_price?: string;
  built_year?: string;
  tax_year?: string;
  property_tax?: string;
  property_disclosure?: string;
  property_type?: ValueInterface;
  building_style?: ValueInterface;
  amenities?: ValueInterface[];
  utilities?: ValueInterface[];

  // Size
  living_area?: string;
  living_area_units?: ValueInterface;
  total_size?: string;
  total_size_units?: ValueInterface;
  beds?: string;
  baths?: string;
  baths_full?: string;
  baths_half?: string;
  kitchens?: string;
  additional_rooms?: string;
  name?: string;

  // ...
}
