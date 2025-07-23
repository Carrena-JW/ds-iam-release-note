// Navigation hierarchy interfaces
export interface NavigationItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  isSelectable: boolean;
  children?: NavigationItem[];
  systemId?: string; // Links to actual system data
}

export interface NavigationCategory {
  id: string;
  name: string;
  icon?: string;
  items: NavigationItem[];
}

// Legacy System interface (still used for release data)
export interface System {
  id: string;
  name: string;
}

export interface ReleaseItem {
  id: string;
  version: string;
  date: string;
  title: string;
  content: string;
  author?: string;
  department?: string;
  publishedAt?: string; // yyyy-MM-dd HH:mm:ss format
}

export interface Comment {
  id: string;
  releaseItemId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string; // For nested replies
}

export interface BreadcrumbItem {
  name: string;
  path?: string;
  isActive: boolean;
}

export interface ReleaseNote {
  systemId: string;
  items: ReleaseItem[];
}
