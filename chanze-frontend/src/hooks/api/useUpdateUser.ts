import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types'

interface UpdateUserData {
  email?: string
  firstName?: string
  lastName?: string
}

// Mock API function - replace with actual API call
const updateUser = async ({ id, data }: { id: string; data: UpdateUserData }): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock response
  return {
    id,
    email: data.email || 'user@example.com',
    created_at: '2025-01-01T00:00:00.000Z'
  }
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      // Update the user in the cache
      queryClient.setQueryData(['user', updatedUser.id], updatedUser)
      
      // Invalidate users list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}