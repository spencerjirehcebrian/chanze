import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types'

// Mock API function - replace with actual API call
const fetchUsers = async (): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock data
  return [
    {
      id: '1',
      email: 'john.doe@example.com',
      created_at: '2025-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      created_at: '2025-01-02T00:00:00.000Z'
    }
  ]
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}