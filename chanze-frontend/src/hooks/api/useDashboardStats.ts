import { useQuery } from '@tanstack/react-query'

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

// Mock API function - replace with actual API call
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Mock data
  return {
    totalTasks: 12,
    completedTasks: 8,
    inProgressTasks: 4,
    teamMembers: 3,
    completionRate: 87,
    productivityScore: 94,
    activeHours: 32,
    activeProjects: 5
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}