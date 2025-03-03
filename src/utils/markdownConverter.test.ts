import { describe, it, expect } from 'vitest'
import { convertToMarkdown } from './markdownConverter'
import { TableData } from '../types/table'

describe('markdownConverter', () => {
  it('空のデータの場合は空文字列を返すこと', () => {
    const emptyData: TableData = []
    expect(convertToMarkdown(emptyData)).toBe('')
  })

  it('テーブルが正しくMarkdown形式に変換されること', () => {
    const data: TableData = [
      [{ value: 'セル1', isEditing: false }, { value: 'セル2', isEditing: false }],
      [{ value: 'データ1', isEditing: false }, { value: 'データ2', isEditing: false }]
    ]
    
    const result = convertToMarkdown(data)
    expect(result).toContain('| A')
    expect(result).toContain('| B')
    expect(result).toContain('| セル1')
    expect(result).toContain('| セル2')
    expect(result).toContain('| データ1')
    expect(result).toContain('| データ2')
  })

  it('改行が正しく変換されること', () => {
    const data: TableData = [
      [{ value: '行1\n行2', isEditing: false }, { value: 'セル2', isEditing: false }]
    ]
    
    const result = convertToMarkdown(data)
    expect(result).toContain('行1<br>行2')
    expect(result).toContain('セル2')
  })

  it('数値が正しく変換されること', () => {
    const data: TableData = [
      [{ value: 123, isEditing: false }, { value: 456, isEditing: false }]
    ]
    
    const result = convertToMarkdown(data)
    expect(result).toContain('123')
    expect(result).toContain('456')
  })
}) 