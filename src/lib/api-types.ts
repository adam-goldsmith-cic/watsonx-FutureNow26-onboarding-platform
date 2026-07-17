export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface UserProfile {
  id: string;
  name: string;
  role: 'new_starter' | 'manager' | 'hr_admin' | 'it_support' | 'super_admin' | 'admins' | 'onboarders';
  startDate?: string; // ISO date string YYYY-MM-DD — not present in Cognito session
}

export interface TaskState {
  userId: string;
  taskId: string;
  status: TaskStatus;
  dueDate: string; // ISO date YYYY-MM-DD
  completedAt: string | null;
  notes: string | null;
}

export interface OrgPluginConfig {
  pluginId: string;
  enabled: boolean;
  order: number;
  config: unknown;
}

export type OrgConfigResponse = OrgPluginConfig[];

// ── V2 Entity Types ───────────────────────────────────────────────────────────

export type MeetingStatus = 'upcoming' | 'done' | 'happening-now';

export interface Meeting {
  meetingId: string;
  userId: string;
  title: string;
  startTime: string;   // HH:MM (24h)
  duration: number;    // minutes
  location: string;
  attendees: string[];
  date: string;        // ISO date YYYY-MM-DD
  status: MeetingStatus;
  bobPrepNote: string;
}

export interface OrgNode {
  nodeId: string;
  name: string;
  role: string;
  initials: string;
  color: string;       // hex — dynamic from seed data, inline style allowed
  bio: string;
  parentId: string | null;
  isCurrentUser: boolean;
  level: number;       // 0 = root, ascending
}

export type SlackMessageType = 'dm' | 'channel' | 'mention';

export interface SlackMessage {
  messageId: string;
  userId: string;
  senderName: string;
  channel: string;
  type: SlackMessageType;
  timestamp: string;   // ISO datetime string
  preview: string;
  fullText: string;
  initials: string;
  color: string;       // hex — dynamic from seed data, inline style allowed
  isUnread: boolean;
}

export type SentimentMood = 'overwhelmed' | 'getting-there' | 'good' | 'excellent';

export interface SentimentEntry {
  entryId: string;
  userId: string;
  mood: SentimentMood;
  notes: string | null;
  createdAt: string;   // ISO datetime string
}
