import { api } from '@/lib/api';
import type {
  CreateRoomRequestDto,
  PaginatedResponse,
  RoomResponseDto,
  RoomType,
  UpdateRoomRequestDto,
} from '@nis/shared';

export interface RoomsFilterParams {
  search?: string;
  type?: RoomType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const roomsApi = {
  list: (params?: RoomsFilterParams) =>
    api.get<PaginatedResponse<RoomResponseDto>>('/rooms', { params }).then((res) => res.data),

  getById: (id: string) => api.get<RoomResponseDto>(`/rooms/${id}`).then((res) => res.data),

  create: (dto: CreateRoomRequestDto) =>
    api.post<RoomResponseDto>('/rooms', dto).then((res) => res.data),

  update: (id: string, dto: UpdateRoomRequestDto) =>
    api.patch<RoomResponseDto>(`/rooms/${id}`, dto).then((res) => res.data),

  remove: (id: string) => api.delete<void>(`/rooms/${id}`).then((res) => res.data),
};
