import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@/types'

interface CreateUserData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// Mock API function - replace with actual API call
const createUser = async (data: CreateUserData): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock response
  return {
    id: Math.random().toString(36).substr(2, 9),
    email: data.email,
    created_at: new Date().toISOString()
  }
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}