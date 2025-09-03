import { apiClient } from './client'
import type { ApiResponse } from './client'

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  teamMembers: number
  completionRate: number
  productivityScore: number
  activeHours: number
  activeProjects: number
}

export interface ChartData {
  name: string
  value: number
  date?: string
}

export interface ActivityItem {
  id: string
  type: 'task_completed' | 'task_created' | 'task_updated' | 'user_joined'
  title: string
  description: string
  timestamp: string
  userId?: string
  userName?: string
}

export interface DashboardData {
  stats: DashboardStats
  weeklyProgress: ChartData[]
  categoryData: ChartData[]
  recentActivity: ActivityItem[]
}

class DashboardService {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/dashboard/stats')
  }

  async getWeeklyProgress(): Promise<ApiResponse<ChartData[]>> {
    return apiClient.get<ChartData[]>('/dashboard/weekly-progress')
  }

  async getCategoryData(): Promise<ApiResponse<ChartData[]>> {
    return apiClient.get<ChartData[]>('/dashboard/categories')
  }

  async getRecentActivity(limit: number = 10): Promise<ApiResponse<ActivityItem[]>> {
    return apiClient.get<ActivityItem[]>(`/dashboard/activity?limit=${limit}`)
  }

  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return apiClient.get<DashboardData>('/dashboard')
  }

  async getAnalyticsData(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ApiResponse<{
    performanceStats: DashboardStats
    trends: ChartData[]
    comparisons: ChartData[]
  }>> {
    return apiClient.get(`/dashboard/analytics?period=${period}`)
  }
}

export const dashboardService = new DashboardService()