import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Layout
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  
  // Modals and dialogs
  modals: Record<string, boolean>
  
  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarOpen: (open: boolean) => void
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingStates: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        sidebarCollapsed: false,
        sidebarOpen: true,
        modals: {},
        globalLoading: false,
        loadingStates: {},

        setTheme: (theme) => set(() => ({
          theme
        }), undefined, 'ui/setTheme'),

        toggleSidebar: () => set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        }), undefined, 'ui/toggleSidebar'),

        setSidebarCollapsed: (collapsed) => set(() => ({
          sidebarCollapsed: collapsed
        }), undefined, 'ui/setSidebarCollapsed'),

        setSidebarOpen: (open) => set(() => ({
          sidebarOpen: open
        }), undefined, 'ui/setSidebarOpen'),

        openModal: (modalId) => set((state) => ({
          modals: { ...state.modals, [modalId]: true }
        }), undefined, 'ui/openModal'),

        closeModal: (modalId) => set((state) => ({
          modals: { ...state.modals, [modalId]: false }
        }), undefined, 'ui/closeModal'),

        toggleModal: (modalId) => set((state) => ({
          modals: { 
            ...state.modals, 
            [modalId]: !state.modals[modalId] 
          }
        }), undefined, 'ui/toggleModal'),

        setGlobalLoading: (loading) => set(() => ({
          globalLoading: loading
        }), undefined, 'ui/setGlobalLoading'),

        setLoadingState: (key, loading) => set((state) => ({
          loadingStates: { ...state.loadingStates, [key]: loading }
        }), undefined, 'ui/setLoadingState'),

        clearLoadingStates: () => set(() => ({
          loadingStates: {}
        }), undefined, 'ui/clearLoadingStates'),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
)

// Selectors for common use cases
export const useIsModalOpen = (modalId: string) => useUIStore(state => !!state.modals[modalId])
export const useIsLoading = (key?: string) => useUIStore(state => 
  key ? !!state.loadingStates[key] : state.globalLoading
)