export interface Todo {
  id: number;
  task: string;
  is_complete: boolean;
  user_id: string;
  inserted_at: string;
}

export interface User {
  id: string;
  email?: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: Todo;
        Insert: Omit<Todo, 'id' | 'inserted_at'>;
        Update: Partial<Omit<Todo, 'id' | 'user_id' | 'inserted_at'>>;
      };
    };
  };
}