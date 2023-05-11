import { UserInputModel } from './base-user';
import { GeoLocation } from './maps';

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
  search_highlights?: {
    labels: {
      ne: GeoLocation;
      sw: GeoLocation;
      lat: number;
      lng: number;
      name: string;
      zoom: number;
      title: string;
    }[];
  };
  brokerage_name?: string;
  brokerage_id?: string;
  profile_slug?: string;
}
export interface AgentMetatags extends AgentMetatagsInput {
  id: number;
}

export interface AgentSignUpInput {
  agent_id: string;
  email: string;
  password: string;
  full_name: string;
}

export interface BrokerageInputModel {
  name?: string;
  full_address?: string;
  phone_number?: string;
  website_url?: string;
}

export interface RealtorInputModel extends UserInputModel {
  agent_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface AgentData {
  id: number;
  agent_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
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
}
