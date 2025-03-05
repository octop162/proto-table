import { TableData, CellValue } from '../types/table'
import { calculateMarkdownTextWidth } from './cellWidthCalculator'

/**
 * テーブルデータをMarkdown形式に変換
 * @param data テーブルデータ
 * @returns Markdown形式の文字列
 */
export const convertToMarkdown = (data: TableData): string => {
  if (!data.length || !data[0].length) return ''

  // 一番上の行をヘッダーとして使用（改行を<br>に変換する前の値で幅を計算するため、formatCellValueを使わない）
  const headerValues = data[0].map(cell => normalizeValue(cell.value))
  const headerRow = headerValues.map(value => formatCellValue(value))
  
  // 1行だけの場合は区切り行を追加しない
  if (data.length === 1) {
    return '| ' + headerRow.join(' | ') + ' |'
  }
  
  // ヘッダー行
  let markdown = '| ' + headerRow.join(' | ') + ' |\n'
  
  // 各列の最大幅を計算（すべての行を考慮）
  const columnMaxWidths = Array(data[0].length).fill(0);
  
  // すべての行をループして各列の最大幅を計算
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellValue = normalizeValue(row[colIndex].value);
      const cellWidth = calculateMarkdownTextWidth(cellValue);
      if (cellWidth > columnMaxWidths[colIndex]) {
        columnMaxWidths[colIndex] = cellWidth;
      }
    }
  }
  
  // 区切り行（各列の最大文字幅に応じてハイフンの数を調整）
  markdown += '|' + columnMaxWidths.map(width => {
    // 文字列の表示幅に基づいてハイフンの数を決定（最低3つ）
    const hyphenCount = Math.max(3, width);
    return '-'.repeat(hyphenCount);
  }).join('|') + '|\n'
  
  // データ行（ヘッダー行を除く）
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    markdown += '| ' + row.map(cell => {
      // セル内の改行を<br>タグに変換し、数値を文字列に変換
      const value = formatCellValue(normalizeValue(cell.value))
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
 * 値を正規化する（改行コードの正規化と末尾の改行削除）
 * @param value セルの値
 * @returns 正規化された値
 */
const normalizeValue = (value: CellValue): string => {
  if (typeof value === 'number') return String(value)
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
  
  return trimmedValue;
}

/**
 * セルの値を整形する（改行を<br>に変換）
 * @param value セルの値
 * @returns 整形された値
 */
const formatCellValue = (value: string): string => {
  // 改行を<br>に変換
  return value.replace(/\n/g, '<br>')
} 