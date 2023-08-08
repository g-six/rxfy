export type SlackText = {
  type: 'mrkdwn' | 'plain_text';
  emoji?: boolean;
  text: string;
};

export type SlackElement = {
  type: 'image' | 'mrkdwn';
  alt_text?: string;
  image_url?: string;
  text?: string;
};

export type SlackAccessory = {
  type: 'button' | 'image';
  text?: SlackText;
  style?: 'primary' | 'danger' | 'info';
  url?: string;
  image_url?: string;
  alt_text?: string;
  value?: string;
};

export type SlackBlock = {
  type: 'context' | 'divider' | 'section' | 'actions';
  accessory?: SlackAccessory;
  fields?: SlackText[];
  text?: SlackText;
  elements?: SlackElement[] | SlackAccessory[];
};
