export const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SPORTS', 'AUDITORIUM', 'OTHER'] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

// Academic year format: "2025-2026". Used by class_subjects + grades (Week 4).
export const ACADEMIC_YEAR_PATTERN = /^[0-9]{4}-[0-9]{4}$/;
