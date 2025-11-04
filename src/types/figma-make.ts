export interface PR {
  id: string;
  title: string;
  number: number;
  author: {
    name: string;
    avatar: string;
  };
  labels: string[];
  mergedDate: string;
  repo: string;
  branch: string;
  filesChanged: number;
  selected?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'loom';
  url: string;
  thumbnail?: string;
  caption?: string;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  audience: string;
  tokens: string[];
  toneDefaults: {
    conciseDetailed: number;
    playfulFormal: number;
    technicalLay: number;
  };
  constraints?: {
    charLimit?: number;
    lineLimit?: number;
  };
  preview: string;
}

export interface ReleaseStatus {
  status: 'draft' | 'in-review' | 'changes-requested' | 'approved' | 'scheduled' | 'published' | 'failed';
  lastUpdated: string;
  owner: string;
  approvers?: string[];
}

export interface AudienceOutput {
  audience: string;
  content: string;
  charCount: number;
  edited: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  position?: number;
}
