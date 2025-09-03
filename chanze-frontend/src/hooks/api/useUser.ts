import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types'

// Mock API function - replace with actual API call
const fetchUser = async (id: string): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock data
  return {
    id,
    email: `user-${id}@example.com`,
    created_at: '2025-01-01T00:00:00.000Z'
  }
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}