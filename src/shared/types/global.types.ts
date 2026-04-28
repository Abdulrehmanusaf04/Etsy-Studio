// ============================================
// BRD-Aligned Type Definitions
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  shop_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  short_description: string | null;
  detailed_system_prompt: string | null;
  category_id: string | null;
  reference_images_json: string[];
  style_tags_json: string[];
  default_category: string | null;
  default_resolution: string | null;
  default_aspect_ratio: string | null;
  settings: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Generation {
  id: string;
  user_id: string;
  category_id: string | null;
  preset_id: string | null;
  source_type: "manual" | "auto";
  title: string;
  description: string | null;
  prompt: string;
  original_prompt: string | null;
  refined_prompt: string | null;
  resolution: string;
  aspect_ratio: string;
  status: "pending" | "processing" | "completed" | "failed";
  image_with_text_url: string | null;
  image_without_text_url: string | null;
  thumbnail_url: string | null;
  variations_json: string[];
  etsy_title: string | null;
  etsy_description: string | null;
  etsy_tags: string[] | null;
  settings_json: Record<string, unknown>;
  metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  preset?: Preset;
  mockup_sets?: MockupSet[];
  etsy_descriptions?: EtsyDescription[];
}

export interface Asset {
  id: string;
  user_id: string;
  generation_id: string | null;
  asset_type: "template_with_text" | "template_without_text" | "variation" | "mockup" | "reference_image";
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  metadata_json: Record<string, unknown>;
  storage_bucket: string;
  created_at: string;
}

export interface MockupSet {
  id: string;
  generation_id: string;
  user_id: string;
  base_template_asset_id: string | null;
  mockup_count: number;
  consistency_status: "pending" | "passed" | "failed" | "manual_review";
  mockup_assets_json: MockupAsset[];
  created_at: string;
  updated_at: string;
}

export interface MockupAsset {
  url: string;
  file_name: string;
  description: string;
}

export interface EtsyDescription {
  id: string;
  generation_id: string;
  user_id: string;
  title: string;
  description_body: string | null;
  features_json: string[];
  usage_instructions: string | null;
  download_details: string | null;
  tags_json: string[];
  created_at: string;
  updated_at: string;
}

export interface GenerationVersion {
  id: string;
  parent_generation_id: string;
  user_id: string;
  version_number: number;
  changed_fields_json: Record<string, unknown>;
  new_generation_id: string | null;
  created_at: string;
}

export interface AIRequestLog {
  id: string;
  user_id: string;
  generation_id: string | null;
  request_type: "prompt_refinement" | "template_generation" | "auto_generation" | "mockup_generation" | "description_generation";
  status: "success" | "failed";
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

// Form data types
export interface ManualGenerateFormData {
  category_id: string;
  prompt: string;
  preset_id?: string;
  reference_images?: File[];
  aspect_ratio?: string;
  enable_variations?: boolean;
}

export interface AutoGenerateFormData {
  category_id: string;
  preset_id: string;
  aspect_ratio?: string;
}

export interface MockupGenerateFormData {
  generation_id: string;
  template_url: string;
  category_name: string;
}

export interface PresetFormData {
  name: string;
  short_description: string;
  detailed_system_prompt: string;
  category_id?: string;
  style_tags?: string[];
  default_aspect_ratio?: string;
}
