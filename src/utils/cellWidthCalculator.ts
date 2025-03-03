import { TableData } from '../types/table';

/**
 * 文字列の表示幅を計算する
 * 全角文字は半角の2倍の幅として計算
 * @param text 計算する文字列
 * @returns 表示幅（文字単位）
 */
export const calculateTextWidth = (text: string): number => {
  if (!text) return 0;
  
  // 全角文字かどうかを判定する関数
  const isFullWidth = (char: string): boolean => {
    const code = char.charCodeAt(0);
    // ASCII文字と半角カタカナ以外は全角とみなす
    return !(code >= 0x0001 && code <= 0x007E) && !(code >= 0xFF61 && code <= 0xFF9F);
  };
  
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    // 全角文字は2、半角文字は1としてカウント
    width += isFullWidth(text[i]) ? 2 : 1;
  }
  
  return width;
};

/**
 * セルの最適な幅をピクセル単位で計算
 * @param text セルのテキスト
 * @param minWidth 最小幅（px）
 * @param charWidth 1文字あたりの幅（px）
 * @returns 最適な幅（px）
 */
export const calculateCellWidth = (text: string, minWidth = 80, charWidth = 8): number => {
  if (!text) return minWidth;
  
  // 改行で分割して各行の幅を計算
  const lines = text.split('\n');
  const lineWidths = lines.map(line => calculateTextWidth(line) * charWidth);
  
  // 最も幅の広い行を基準にする
  const maxLineWidth = Math.max(...lineWidths);
  
  // 最小幅と計算幅を比較して大きい方を返す
  return Math.max(minWidth, maxLineWidth + 16); // パディング分を追加
};

/**
 * テーブルデータの各列の最適な幅を計算
 * @param data テーブルデータ
 * @returns 各列の幅の配列（px単位）
 */
export const calculateColumnWidths = (data: TableData): number[] => {
  if (!data.length || !data[0].length) return [];
  
  const columnCount = data[0].length;
  const widths: number[] = Array(columnCount).fill(80); // デフォルト幅
  
  // 各列ごとに最大幅を計算
  for (let colIndex = 0; colIndex < columnCount; colIndex++) {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const cellValue = data[rowIndex][colIndex].value || '';
      const cellWidth = calculateCellWidth(cellValue);
      
      if (cellWidth > widths[colIndex]) {
        widths[colIndex] = cellWidth;
      }
    }
  }
  
  return widths;
}; 