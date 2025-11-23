import { cn } from '@/lib/utils'
import { useState, useEffect, useRef, type FC } from 'react'
import { Input, Button, ScrollArea } from '@extension/ui'
import { Check, X, Plus, Trash2 } from 'lucide-react'
import { useStorage } from '@extension/shared'
import { todoItemsStorage, type TodoItem } from '@extension/storage'

interface TodoItemProps {
  todo: TodoItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const TodoItemComponent: FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-white/20',
        'dark:hover:bg-black/20',
      )}>
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
          todo.completed
            ? 'border-green-600 bg-green-500/30 dark:border-green-400 dark:bg-green-500/30'
            : 'border-gray-500 hover:border-gray-400 dark:border-gray-400 dark:hover:border-gray-300',
        )}>
        {todo.completed && <Check size={14} className="text-green-700 dark:text-green-300" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          'flex-1 text-sm transition-all font-medium',
          todo.completed
            ? 'text-gray-600 line-through dark:text-gray-400'
            : 'text-gray-900 dark:text-gray-100',
        )}>
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className={cn(
          'opacity-0 transition-opacity group-hover:opacity-100',
          'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
        )}>
        <X size={16} />
      </button>
    </div>
  )
}

export const TodoCard: FC<{ className?: string }> = ({ className }) => {
  const todos = useStorage(todoItemsStorage)
  const [newTodoText, setNewTodoText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleAddTodo = async () => {
    if (newTodoText.trim()) {
      await todoItemsStorage.add(newTodoText.trim())
      setNewTodoText('')
      setIsAdding(false)
    }
  }

  const handleToggleTodo = async (id: string) => {
    await todoItemsStorage.toggleCompleted(id)
  }

  const handleDeleteTodo = async (id: string) => {
    await todoItemsStorage.removeById(id)
  }

  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  return (
    <div
      className={cn(
        className,
        'backdrop-blur-2xl rounded-2xl shadow-lg dark:backdrop-brightness-75',
        'bg-white/40 dark:bg-slate-800/40 overflow-hidden border border-white/20 dark:border-slate-700/30',
      )}>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Todo List</h3>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {activeTodos.length} active
          </div>
        </div>

        <ScrollArea className="max-h-64" scrollHideDelay={200}>
          <div className="space-y-1">
            {activeTodos.map(todo => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
            {completedTodos.length > 0 && activeTodos.length > 0 && (
              <div className="my-2 border-t border-gray-300/20 dark:border-gray-600/20" />
            )}
            {completedTodos.map(todo => (
              <TodoItemComponent
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="mt-3">
          {isAdding ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddTodo()
                  } else if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewTodoText('')
                  }
                }}
                placeholder="Enter todo..."
                className="flex-1 h-9 bg-white/70 dark:bg-slate-700/70 text-gray-900 dark:text-gray-100"
              />
              <Button onClick={handleAddTodo} size="sm" variant="ghost" className="h-9 px-3">
                <Check size={16} />
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false)
                  setNewTodoText('')
                }}
                size="sm"
                variant="ghost"
                className="h-9 px-3">
                <X size={16} />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 font-medium">
              <Plus size={16} />
              Add task
            </Button>
          )}
        </div>

        {completedTodos.length > 0 && (
          <div className="mt-2">
            <Button
              onClick={() => todoItemsStorage.clearCompleted()}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 font-medium">
              <Trash2 size={14} />
              Clear completed
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
