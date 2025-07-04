export interface IncludesMedia {
  height: number;
  width: number;
  type: 'photo' | 'video' | 'animated_gif';
  url: string;
  preview_image_url: string;
  media_key: string;
}

export interface ConversationIncludes {
  media?: IncludesMedia[];
  users: User[];
}

export interface Mention {
  start: number;
  end: number;
  username: string;
}

export interface Hashtag {
  start: number;
  end: number;
  tag: string;
}

export interface EntityUrl {
  start: number;
  end: number;
  /** format: `https://t.co/[REST]` */
  url: string;
  expanded_url: string;
  /** The possibly truncated URL */
  display_url: string;
  status: number;
  title: string;
  description: string;
  unwound_url: string;
  images?: {
    url: string;
    height: number;
    width: number;
  }[];
}

export interface Attachments {
  poll_id?: string[];
  media_keys?: string[];
}

export interface User {
  username: string;
  description: string;
  profile_image_url: string;
  verified: boolean;
  location: string;
  created_at: string;
  name: string;
  protected: boolean;
  id: string;
  url?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  entities?: {
    url?: {
      urls: EntityUrl[];
    };
    description?: {
      urls?: EntityUrl[];
      mentions?: Mention[];
      hashtags?: Hashtag[];
    };
  };
}

export interface ConversationResponseData {
  conversation_id: string;
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  in_reply_to_user_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    mentions?: Mention[];
    hashtags?: Hashtag[];
    urls?: EntityUrl[];
  };
  referenced_tweets?: {
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }[];
  attachments?: Attachments;
}

/**
 * Types from response after cleanup
 */
export interface ConversationResponse {
  data: ConversationResponseData[];
  includes: ConversationIncludes;
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
  };
  errors?: any;
}
