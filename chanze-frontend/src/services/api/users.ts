import { apiClient } from './client'
import type { ApiResponse } from './client'
import type { User } from '@/types'

export interface CreateUserRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface UpdateUserRequest {
  email?: string
  firstName?: string
  lastName?: string
}

export interface UsersListResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

class UsersService {
  async getUsers(
    page: number = 1, 
    limit: number = 10,
    search?: string
  ): Promise<ApiResponse<UsersListResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    
    return apiClient.get<UsersListResponse>(`/users?${params}`)
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/users/${id}`)
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User, CreateUserRequest>('/users', data)
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User, UpdateUserRequest>(`/users/${id}`, data)
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/users/${id}`)
  }

  async getCurrentUserProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/users/profile')
  }

  async updateCurrentUserProfile(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User, UpdateUserRequest>('/users/profile', data)
  }
}

export const usersService = new UsersService()