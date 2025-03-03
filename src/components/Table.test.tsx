import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table } from './Table'
import { TableData } from '../types/table'

describe('Table', () => {
  const mockData: TableData = [
    [{ value: 'セル1', isEditing: false }, { value: 'セル2', isEditing: false }],
    [{ value: 'セル3', isEditing: false }, { value: 'セル4', isEditing: false }]
  ]

  it('データが正しく表示されること', () => {
    render(<Table initialData={mockData} />)
    
    expect(screen.getByText('セル1')).toBeInTheDocument()
    expect(screen.getByText('セル2')).toBeInTheDocument()
    expect(screen.getByText('セル3')).toBeInTheDocument()
    expect(screen.getByText('セル4')).toBeInTheDocument()
  })
}) 