import { supabase } from '../lib/supabase';
import type { Todo } from '../types';

export class TodoService {
  static async getAllTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('inserted_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createTodo(todo: Omit<Todo, 'id' | 'inserted_at'>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .insert([todo])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTodo(
    id: number, 
    updates: Partial<Pick<Todo, 'task' | 'is_complete'>>
  ): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTodo(id: number): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleTodo(id: number, isComplete: boolean): Promise<Todo> {
    return this.updateTodo(id, { is_complete: !isComplete });
  }
}