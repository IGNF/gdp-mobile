export type CommunityAttributeType = 'text' | 'list' | 'checkbox' | 'date' | 'integer' | 'double';

export interface CommunityThemeAttribute {
  name: string;
  type: CommunityAttributeType;
  mandatory?: boolean;
  values?: string[];
  default?: string;
}

export interface CommunityThemeConfig {
  theme: string;
  communityId: number;
  attributes: CommunityThemeAttribute[];
  autofilled_attributes: CommunityThemeAttribute[];
}
