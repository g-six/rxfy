import { GeoLocation } from './maps';

export type ThemeName = 'hamburg' | 'lisbon' | 'malaga' | 'malta' | 'oslo';

export interface Property {
  id: number;
  attributes: {
    mls_id?: string;
  };
}

export interface AgentMetatags {
  id: number;
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
  linkedinurl?: string;
  twitterurl?: string;
  youtube_url?: string;
  mailchimp_subscription_url?: string;
  target_city?: string;
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
}
