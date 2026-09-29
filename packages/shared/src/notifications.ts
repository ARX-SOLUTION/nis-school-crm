export const NOTIFICATION_CHANNELS = ['TELEGRAM', 'SMS', 'IN_APP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_TYPES = ['ATTENDANCE', 'GRADE', 'PAYMENT', 'ANNOUNCEMENT'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TARGETS = [
  'ALL_USERS',
  'ALL_PARENTS',
  'ALL_TEACHERS',
  'CLASS_PARENTS',
] as const;
export type NotificationTarget = (typeof NOTIFICATION_TARGETS)[number];

export interface SendBroadcastRequestDto {
  title: string;
  message: string;
  target: NotificationTarget;
  classId?: string;
}

export interface NotificationLogDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  channel: NotificationChannel;
  recipientCount: number;
  sentByUserId?: string | null;
  sentByName?: string | null;
  createdAt: string | Date;
}
