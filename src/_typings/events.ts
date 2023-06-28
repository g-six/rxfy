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
  MapHomeAlertToast = 'event-map-home-alert',
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
  SelectCustomerCard = 'evt-customer-selected',
  SelectCustomerLovedProperty = 'evt-loved-property-selected',
  AddPropertyToCompare = 'evt-add-property-to-compare',
  AddPropertyFilter = 'evt-add-property-filter',
  LoadLovers = 'evt-load-lovers',
  LoadMap = 'evt-load-map',
  CustomerDataChange = 'evt-customer-edit',
  QueueUpload = 'evt-queue-upload',
  UploadBrokerageLogo = 'evt-upload-brokerage-logo',
  UploadOGImage = 'evt-upload-ogimage',
  UploadFavicon = 'evt-upload-favicon',
  UploadHeadshot = 'evt-upload-headshot',
  UploadProfileImage = 'evt-upload-profile-image',
  UploadLogoForLightBg = 'evt-upload-logo-for-light-bg',
  UploadLogoForDarkBg = 'evt-upload-logo-for-dark-bg',
  CreateCustomerForm = 'evt-new-client',
  AddCustomerNote = 'evt-add-customer-note',
  EditCustomerNote = 'evt-edit-customer-note',
  CRMCustomerCardActions = 'evt-open-customer-status',
  SaveCustomerNote = 'evt-save-customer-note',
  SaveClient = 'evt-save-client',
  Logout = 'evt-logout',
  Blank = 'blank',
  AgentMyListings = 'agent-my-listings',
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
  region?: string;
  building_unit?: string;
  city?: string;
  state_province?: string;
  postal_zip_code?: string;
  lat?: number;
  lon?: number;
  title?: string;

  // Home Summary
  asking_price?: string;
  year_built?: number;
  tax_year?: string;
  gross_taxes?: string;
  property_disclosure?: string;
  // property_type?: ValueInterface;
  dwelling_type?: ValueInterface;
  building_style?: ValueInterface;
  amenities?: ValueInterface[];
  connected_services?: ValueInterface[];

  // Size
  floor_area_total?: number;
  floor_area_uom?: string;
  lot_area?: number;
  lot_uom?: string;
  beds?: number;
  baths?: number;
  full_baths?: number;
  half_baths?: number;
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
  strata_fee?: string;
  restrictions?: string;
  minimum_age_restriction?: string;
  total_dogs_allowed?: number;
  total_cats_allowed?: number;
  total_pets_allowed?: number;
  total_allowed_rentals?: string;
  complex_compound_name?: string;
  building_amenities?: ValueInterface[];
  council_approval_required?: boolean;
  locked?: boolean;

  // Not to be saved in Strapi
  upload_queue?: {
    [key: string]: string | number | boolean;
  };

  // ...
}
