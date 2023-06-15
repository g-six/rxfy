import { MLSProperty } from './property';
import { SavedSearchInput } from './saved-search';
import { ImagePreview } from '@/hooks/useFormEvent';
import { ValueInterface, RoomDimension } from '@/_typings/ui-types';

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
  SaveUserSession = 'save-session',
  UpdateWebsite = 'update-website',
  UpdateBrokerage = 'update-brokerage',
  UpdateBrandPreferences = 'update-brand-preferences',
  DashboardMenuTab = 'dashboard-menu-tab',
  ResetForm = 'evt-reset-form',
  UploadBrokerageLogo = 'evt-upload-brokerage-logo',
  UploadOGImage = 'evt-upload-ogimage',
  UploadFavicon = 'evt-upload-favicon',
  UploadHeadshot = 'evt-upload-headshot',
  UploadProfileImage = 'evt-upload-profile-image',
  UploadLogoForLightBg = 'evt-upload-logo-for-light-bg',
  UploadLogoForDarkBg = 'evt-upload-logo-for-dark-bg',
  Logout = 'evt-logout',
  Blank = 'blank',
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
  id?: number; // strapi record id, if item of the form data should be saved in DB
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
    postal_zip_code?: string;
    neighbourhood?: string;
    lat?: number;
    lon?: number;
  };
  strapi?: object;
  photos?: ImagePreview[];

  // Address
  neighbourhood?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  title?: string;

  // Home Summary
  asking_price?: string;
  built_year?: string;
  tax_year?: string;
  property_tax?: string;
  property_disclosure?: string;
  property_type?: ValueInterface;
  dwelling_type?: ValueInterface;
  building_style?: ValueInterface;
  amenities?: ValueInterface[];
  utilities?: ValueInterface[];

  // Size
  living_area?: number;
  living_area_units?: ValueInterface;
  total_size?: number;
  total_size_units?: ValueInterface;
  beds?: number;
  baths?: number;
  baths_full?: number;
  baths_half?: number;
  kitchens?: number;
  additional_rooms?: number;
  garage?: number;

  // Rooms
  beds_dimensions?: RoomDimension[];
  baths_full_dimensions?: RoomDimension[];
  baths_half_dimensions?: RoomDimension[];
  kitchen_dimensions?: RoomDimension[];
  garage_dimensions?: RoomDimension[];
  additional_dimensions?: RoomDimension[];

  // Strata
  building_bylaws?: string;
  maintenance_fee?: string;
  restrictions?: string;
  age_restriction?: string;
  dogs?: string;
  cats?: string;
  total_pets_allowed?: string;
  total_rentals_allowed?: string;
  complex_name?: string;
  building_amenities?: ValueInterface[];
  council_approval_required?: boolean;
  locked?: boolean;

  // Not to be saved in Strapi
  upload_queue?: {
    [key: string]: string | number | boolean;
  };

  // ...
}
