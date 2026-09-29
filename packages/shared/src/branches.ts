export interface BranchDto {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateBranchDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}
