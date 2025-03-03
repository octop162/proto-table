import { TableData, CellValue } from '../types/table'

/**
 * テーブルデータをMarkdown形式に変換する
 * @param data テーブルデータ
 * @returns Markdown形式の文字列
 */
export const convertToMarkdown = (data: TableData): string => {
  if (!data.length || !data[0].length) return ''

  // ヘッダー行の作成
  const headers = data[0].map((_, index) => String.fromCharCode(65 + index))
  
  // 各列の最大幅を計算
  const columnWidths = calculateColumnWidths(data, headers)
  
  // ヘッダー行
  let markdown = '| ' + headers.map((header, i) => 
    padString(header, columnWidths[i])).join(' | ') + ' |\n'
  
  // 区切り行
  markdown += '|' + columnWidths.map(width => 
    '-'.repeat(width + 2)).join('|') + '|\n'
  
  // データ行
  data.forEach(row => {
    markdown += '| ' + row.map((cell, colIndex) => 
      padString(formatCellValue(cell.value), columnWidths[colIndex])).join(' | ') + ' |\n'
  })
  
  return markdown.trim()
}

/**
 * セルの値を整形する（改行を<br>に変換）
 * @param value セルの値
 * @returns 整形された値
 */
const formatCellValue = (value: CellValue): string => {
  if (typeof value === 'number') return value.toString()
  return value.replace(/\n/g, '<br>')
}

/**
 * 各列の最大幅を計算する
 * @param data テーブルデータ
 * @param headers ヘッダー行
 * @returns 各列の最大幅の配列
 */
const calculateColumnWidths = (data: TableData, headers: string[]): number[] => {
  const widths: number[] = headers.map(h => h.length)
  
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellValue = formatCellValue(cell.value)
      if (colIndex < widths.length && cellValue.length > widths[colIndex]) {
        widths[colIndex] = cellValue.length
      }
    })
  })
  
  return widths
}

/**
 * 文字列を指定の長さになるようにパディングする
 * @param str 文字列
 * @param length 目標の長さ
 * @returns パディングされた文字列
 */
const padString = (str: string, length: number): string => {
  return str + ' '.repeat(Math.max(0, length - str.length))
} 