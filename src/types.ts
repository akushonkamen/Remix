export interface Category {
  id: number;
  name: string;
}

export interface Entry {
  id: number;
  url: string;
  title: string;
  summary: string;
  image_url: string;
  category_id: number;
  category_name: string;
  created_at: string;
}
