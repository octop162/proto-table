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
    
    const expected = '| セル1 | セル2 |\n|---|---|\n| データ1 | データ2 |';
    expect(convertToMarkdown(data)).toBe(expected);
  })

  it('改行が正しく変換されること', () => {
    const data: TableData = [
      [{ value: '行1\n行2', isEditing: false }, { value: 'セル2', isEditing: false }]
    ]
    
    const result = convertToMarkdown(data)
    expect(result).toContain('| 行1<br>行2 | セル2 |')
  })

  it('数値が正しく変換されること', () => {
    const data: TableData = [
      [{ value: '123', isEditing: false }, { value: '456', isEditing: false }]
    ]
    
    const result = convertToMarkdown(data)
    expect(result).toBe('| 123 | 456 |')
  })

  it('末尾の改行が削除されること', () => {
    const data: TableData = [
      [{ value: 'ヘッダー1', isEditing: false }, { value: 'ヘッダー2', isEditing: false }],
      [{ value: '値1\n', isEditing: false }, { value: '値2\n\n', isEditing: false }]
    ]
    
    const expected = '| ヘッダー1 | ヘッダー2 |\n|---|---|\n| 値1 | 値2 |';
    expect(convertToMarkdown(data)).toBe(expected);
  })

  it('異なる改行コード（CR、CRLF）が正しく処理されること', () => {
    const data: TableData = [
      [{ value: 'ヘッダー1', isEditing: false }, { value: 'ヘッダー2', isEditing: false }],
      [{ value: '値1\r\n改行後', isEditing: false }, { value: '値2\r改行後', isEditing: false }]
    ]
    
    const expected = '| ヘッダー1 | ヘッダー2 |\n|---|---|\n| 値1<br>改行後 | 値2<br>改行後 |';
    expect(convertToMarkdown(data)).toBe(expected);
  })
}) 