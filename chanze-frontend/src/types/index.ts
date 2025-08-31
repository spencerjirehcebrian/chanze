export * from './database';

export interface AuthState {
  user: import('./database').User | null;
  loading: boolean;
}

export interface TodoFormData {
  task: string;
}