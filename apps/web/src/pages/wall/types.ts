export interface WallPost {
  id: number;
  parentId: number | null;
  nickname: string;
  body: string;
  tag: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface WallComment {
  id: number;
  parentId: number | null;
  nickname: string;
  body: string;
  createdAt: string;
}

export interface WallPostsResponse {
  items: WallPost[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type WallSort = "latest" | "hot";
