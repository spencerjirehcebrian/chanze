class StorageService {
  // Local Storage methods
  setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to set localStorage item "${key}":`, error)
    }
  }

  getLocal<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error)
      return null
    }
  }

  removeLocal(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error)
    }
  }

  clearLocal(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  // Session Storage methods
  setSession<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to set sessionStorage item "${key}":`, error)
    }
  }

  getSession<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.warn(`Failed to get sessionStorage item "${key}":`, error)
      return null
    }
  }

  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item "${key}":`, error)
    }
  }

  clearSession(): void {
    try {
      sessionStorage.clear()
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error)
    }
  }

  // Utility methods
  isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  isSessionStorageAvailable(): boolean {
    try {
      const test = '__storage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  // Get storage size (approximate)
  getLocalStorageSize(): number {
    let total = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }
}

export const storageService = new StorageService()