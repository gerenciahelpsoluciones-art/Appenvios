export type SocialPlatform = 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'whatsapp';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';

export interface Post {
  id: string;
  title: string | null;
  copy: string;
  hashtags: string[];
  platform: SocialPlatform;
  image_url: string | null;
  image_prompt: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  n8n_execution_id: string | null;
  engagement: PostEngagement | null;
  created_at: string;
  updated_at: string;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

export interface SocialMetrics {
  id: string;
  platform: SocialPlatform;
  followers: number;
  following: number;
  posts_count: number;
  engagement_rate: number;
  reach_7d: number;
  impressions_7d: number;
  clicks_7d: number;
  top_post_id: string | null;
  snapshot_date: string;
}

export interface NewPost {
  title?: string;
  copy: string;
  hashtags: string[];
  platform: SocialPlatform;
  image_url?: string;
  image_prompt?: string;
  scheduled_at?: string;
  status?: PostStatus;
}
