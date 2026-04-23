import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Sin datos' }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-800">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-surface-800 bg-surface-900">
            {columns.map(col => (
              <th key={col.key} className={cn('px-4 py-3 text-xs font-semibold text-surface-500 uppercase', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="border-b border-surface-800 hover:bg-surface-800/50">
                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3 text-surface-200', col.className)}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}