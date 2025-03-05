import { TableData, CellValue } from '../types/table'
import { calculateTextWidth } from './cellWidthCalculator'

/**
 * テーブルデータをMarkdown形式に変換
 * @param data テーブルデータ
 * @returns Markdown形式の文字列
 */
export const convertToMarkdown = (data: TableData): string => {
  if (!data.length || !data[0].length) return ''

  // 一番上の行をヘッダーとして使用
  const headerRow = data[0].map(cell => formatCellValue(cell.value))
  
  // 1行だけの場合は区切り行を追加しない
  if (data.length === 1) {
    return '| ' + headerRow.join(' | ') + ' |'
  }
  
  // ヘッダー行
  let markdown = '| ' + headerRow.join(' | ') + ' |\n'
  
  // 区切り行（文字の表示幅に応じてハイフンの数を調整）
  markdown += '|' + headerRow.map(cell => {
    // 文字列の表示幅に基づいてハイフンの数を決定（最低3つ）
    const hyphenCount = Math.max(3, calculateTextWidth(cell));
    return '-'.repeat(hyphenCount);
  }).join('|') + '|\n'
  
  // データ行（ヘッダー行を除く）
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    markdown += '| ' + row.map(cell => {
      // セル内の改行を<br>タグに変換し、数値を文字列に変換
      const value = formatCellValue(cell.value)
      return value
    }).join(' | ') + ' |'
    
    // 最後の行でなければ改行を追加
    if (i < data.length - 1) {
      markdown += '\n'
    }
  }
  
  return markdown
}

/**
 * セルの値を整形する（改行を<br>に変換）
 * @param value セルの値
 * @returns 整形された値
 */
const formatCellValue = (value: CellValue): string => {
  // 数値の場合は文字列に変換
  if (typeof value === 'number') return String(value)
  
  // 文字列の場合は改行を<br>に変換し、末尾の改行を削除
  if (!value) return ''
  
  // 改行コードを正規化（CRLF -> LF）
  let normalizedValue = String(value).replace(/\r\n/g, '\n');
  // CR -> LF
  normalizedValue = normalizedValue.replace(/\r/g, '\n');
  
  // 末尾の改行を削除（複数の改行も対応）
  let trimmedValue = normalizedValue;
  while (trimmedValue.endsWith('\n')) {
    trimmedValue = trimmedValue.slice(0, -1);
  }
  
  // 改行を<br>に変換
  return trimmedValue.replace(/\n/g, '<br>')
} 