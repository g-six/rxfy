import { UserInputModel } from './base-user';
import { CustomerRecord } from './customer';
import { GeoLocation, SearchHighlightInput } from './maps';

export type ThemeName = 'hamburg' | 'lisbon' | 'malaga' | 'malta' | 'oslo';

export interface Property {
  id: number;
  attributes: {
    mls_id?: string;
  };
}

export interface AgentMetatagsInput {
  agent_id: string;
  title?: string;
  description?: string;
  personal_title?: string;
  personal_bio?: string;
  favicon?: string;
  ogimage_url?: string;
  logo_for_dark_bg?: string;
  logo_for_light_bg?: string;
  profile_image?: string;
  headshot?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  mailchimp_subscription_url?: string;
  target_city?: string;
  listings_title?: string;
  search_highlights?: SearchHighlightInput[];
  brokerage_name?: string;
  brokerage_id?: string;
  profile_slug?: string;
  head_code?: string;
  footer_code?: string;
}
export interface AgentMetatags extends AgentMetatagsInput {
  id: number;
}

export interface AgentInput {
  agent_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  brokerage?: number;
}

export interface AgentSignUpInput extends AgentInput {
  password: string;
}

export interface BrokerageInputModel {
  name?: string;
  full_address?: string;
  phone_number?: string;
  website_url?: string;
  logo_url?: string;
  lat?: number;
  lon?: number;
}

export interface RealtorInputModel extends UserInputModel {
  agent_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  metatags?: {
    [key: string]: unknown;
  };
}

export interface BrokerageData {
  id?: number;
  name: string;
  full_address?: string;
  phone_number?: string;
  website_url?: string;
  logo_url?: string;
  lat?: number;
  lon?: number;
  slug?: string;
}

export interface AgentData {
  id: number;
  agent_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
  brokerages?: BrokerageData[];
  sold_properties?: {
    data: Property[];
  };
  website_theme: ThemeName;
  street_1: string;
  street_2: string;
  profile_id?: number;
  api_key: string;
  vcard: string;
  metatags: AgentMetatags;
  domain_name: string;
  webflow_domain: string;
  last_activity_at?: Date;
  encrypted_password?: string;
  customers?: CustomerRecord[];
}
