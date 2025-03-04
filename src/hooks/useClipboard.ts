import { useCallback } from 'react'
import { TableData, Selection, Position } from '../types/table'

type UseClipboardProps = {
  tableData: TableData
  selectedCells: Selection | null
  currentCell: Position | null
  updateCell: (row: number, col: number, value: string) => void
  updateMultipleCells: (positions: Position[], value: string) => void
  addRow?: () => void
  addColumn?: () => void
}

/**
 * コピー＆ペースト機能を管理するカスタムフック
 */
export const useClipboard = ({
  tableData,
  selectedCells,
  currentCell,
  updateCell,
  updateMultipleCells,
  addRow,
  addColumn
}: UseClipboardProps) => {
  /**
   * 選択されたセルの位置を取得
   */
  const getSelectedCellPositions = useCallback((): Position[] => {
    if (!selectedCells) return []

    const minRow = Math.min(selectedCells.start.row, selectedCells.end.row)
    const maxRow = Math.max(selectedCells.start.row, selectedCells.end.row)
    const minCol = Math.min(selectedCells.start.col, selectedCells.end.col)
    const maxCol = Math.max(selectedCells.start.col, selectedCells.end.col)

    const positions: Position[] = []
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        positions.push({ row, col })
      }
    }

    return positions
  }, [selectedCells])

  /**
   * セルの値をExcel形式でフォーマット
   * 改行を含む場合や"を含む場合は特別な処理を行う
   */
  const formatCellValueForExcel = useCallback((value: string): string => {
    // 空の場合はそのまま返す
    if (!value) return value;
    
    // 改行コードを正規化（CRLF -> LF）
    let normalizedValue = value.replace(/\r\n/g, '\n');
    // CR -> LF
    normalizedValue = normalizedValue.replace(/\r/g, '\n');
    
    // 末尾の改行を削除
    const trimmedValue = normalizedValue.endsWith('\n') ? normalizedValue.slice(0, -1) : normalizedValue;
    
    // 改行または"を含む場合は特別な処理が必要
    const needsQuotes = trimmedValue.includes('\n') || trimmedValue.includes('"') || trimmedValue.includes('\t');
    
    if (needsQuotes) {
      // "をエスケープ（""に変換）
      const escapedValue = trimmedValue.replace(/"/g, '""');
      // 値を"で囲む
      return `"${escapedValue}"`;
    }
    
    return trimmedValue;
  }, []);

  /**
   * Excel形式のセル値をパース
   */
  const parseCellValueFromExcel = useCallback((value: string): string => {
    // 空の場合はそのまま返す
    if (!value) return value;
    
    // "で始まり"で終わる場合
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      // 前後の"を削除
      const content = value.slice(1, -1);
      // ""を"に戻す
      const unescaped = content.replace(/""/g, '"');
      
      // 改行コードを正規化（CRLF -> LF）
      return unescaped.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    
    // 改行コードを正規化（CRLF -> LF）
    return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }, []);

  /**
   * 選択されたセルをコピー
   */
  const copySelectedCells = useCallback(() => {
    if (!selectedCells) return

    const minRow = Math.min(selectedCells.start.row, selectedCells.end.row)
    const maxRow = Math.max(selectedCells.start.row, selectedCells.end.row)
    const minCol = Math.min(selectedCells.start.col, selectedCells.end.col)
    const maxCol = Math.max(selectedCells.start.col, selectedCells.end.col)

    let text = ''
    for (let row = minRow; row <= maxRow; row++) {
      const rowData = []
      for (let col = minCol; col <= maxCol; col++) {
        // セルの値をExcel形式でフォーマット
        const formattedValue = formatCellValueForExcel(tableData[row][col].value);
        rowData.push(formattedValue);
      }
      text += rowData.join('\t') + '\n'
    }

    navigator.clipboard.writeText(text)
  }, [selectedCells, tableData, formatCellValueForExcel])

  /**
   * 選択されたセルをカット
   */
  const cutSelectedCells = useCallback(() => {
    if (!selectedCells) return

    // まずコピー
    copySelectedCells()

    // 選択されたセルをクリア
    const positions = getSelectedCellPositions()
    updateMultipleCells(positions, '')
  }, [selectedCells, copySelectedCells, getSelectedCellPositions, updateMultipleCells])

  /**
   * 選択されたセルにペースト
   */
  const pasteToSelectedCells = useCallback(async () => {
    if (!currentCell) return

    try {
      const text = await navigator.clipboard.readText()
      
      // 改行コードを正規化（CRLF -> LF）
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Excel形式のデータを解析（セル内改行を考慮）
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      // 文字ごとに処理
      for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];
        
        if (char === '"') {
          // 次の文字も"の場合はエスケープされた"
          if (i + 1 < normalizedText.length && normalizedText[i + 1] === '"') {
            currentField += '"';
            i++; // 次の"をスキップ
          } else {
            // 引用符の開始または終了
            inQuotes = !inQuotes;
          }
        } else if (char === '\t' && !inQuotes) {
          // 引用符の外側のタブは列の区切り
          currentRow.push(parseCellValueFromExcel(currentField));
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          // 引用符の外側の改行は行の区切り
          currentRow.push(parseCellValueFromExcel(currentField));
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          // 通常の文字（セル内の改行も含む）
          currentField += char;
        }
      }
      
      // 最後のフィールドと行を追加
      if (currentField || currentRow.length > 0) {
        currentRow.push(parseCellValueFromExcel(currentField));
        rows.push(currentRow);
      }
      
      // クリップボードデータの行数と列数を取得
      const clipboardRowCount = rows.length;
      const clipboardColCount = Math.max(...rows.map(row => row.length));
      
      // クリップボードデータが横一列または縦一列かどうかを判定
      const isSingleRow = clipboardRowCount === 1 && clipboardColCount > 1;
      const isSingleColumn = clipboardColCount === 1 && clipboardRowCount > 1;
      // 単一セルのコピーかどうかを判定
      const isSingleCell = clipboardRowCount === 1 && clipboardColCount === 1;
      
      // 選択範囲の情報を取得
      let selectionRowCount = 1;
      let selectionColCount = 1;
      let startRow = currentCell.row;
      let startCol = currentCell.col;
      
      if (selectedCells) {
        const minRow = Math.min(selectedCells.start.row, selectedCells.end.row);
        const maxRow = Math.max(selectedCells.start.row, selectedCells.end.row);
        const minCol = Math.min(selectedCells.start.col, selectedCells.end.col);
        const maxCol = Math.max(selectedCells.start.col, selectedCells.end.col);
        
        selectionRowCount = maxRow - minRow + 1;
        selectionColCount = maxCol - minCol + 1;
        
        // 選択範囲の開始位置をペーストの開始位置として使用
        startRow = minRow;
        startCol = minCol;
      }
      
      // 連続ペーストが必要かどうかを判定
      const needsRepeatedPaste = selectedCells && 
        ((isSingleRow && selectionRowCount > 1) || 
         (isSingleColumn && selectionColCount > 1) ||
         (isSingleCell && (selectionRowCount > 1 || selectionColCount > 1)));
      
      // 必要に応じて行を追加
      let rowsToAdd = 0;
      
      if (needsRepeatedPaste) {
        if (isSingleRow) {
          // 横一列のデータを縦に繰り返す場合
          rowsToAdd = startRow + selectionRowCount - tableData.length;
        } else if (isSingleColumn) {
          // 縦一列のデータを横に繰り返す場合
          rowsToAdd = startRow + clipboardRowCount - tableData.length;
        }
      } else {
        // 通常のペースト
        rowsToAdd = startRow + clipboardRowCount - tableData.length;
      }
      
      if (addRow && rowsToAdd > 0) {
        for (let i = 0; i < rowsToAdd; i++) {
          addRow();
        }
      }
      
      // 必要に応じて列を追加
      let colsToAdd = 0;
      
      if (needsRepeatedPaste) {
        if (isSingleRow) {
          // 横一列のデータを縦に繰り返す場合
          colsToAdd = startCol + clipboardColCount - tableData[0].length;
        } else if (isSingleColumn) {
          // 縦一列のデータを横に繰り返す場合
          colsToAdd = startCol + selectionColCount - tableData[0].length;
        }
      } else {
        // 通常のペースト
        colsToAdd = startCol + clipboardColCount - tableData[0].length;
      }
      
      if (addColumn && colsToAdd > 0) {
        for (let i = 0; i < colsToAdd; i++) {
          addColumn();
        }
      }

      // データをペースト
      if (needsRepeatedPaste) {
        if (isSingleCell && selectedCells) {
          // 単一セルのコピーを複数選択したセルすべてにペースト
          const cellValue = rows[0][0];
          const positions = getSelectedCellPositions();
          
          // 選択したすべてのセルに同じ値をペースト
          positions.forEach(({ row, col }) => {
            // テーブルの範囲内かチェック
            if (row < tableData.length && col < tableData[0].length) {
              updateCell(row, col, cellValue);
            }
          });
        } else if (isSingleRow) {
          // 横一列のデータを縦に繰り返す場合
          for (let rowOffset = 0; rowOffset < selectionRowCount; rowOffset++) {
            rows[0].forEach((cellValue, colOffset) => {
              const targetRow = startRow + rowOffset;
              const targetCol = startCol + colOffset;
              
              // テーブルの範囲内かチェック
              if (targetRow < tableData.length && targetCol < tableData[0].length) {
                updateCell(targetRow, targetCol, cellValue);
              }
            });
          }
        } else if (isSingleColumn) {
          // 縦一列のデータを横に繰り返す場合
          for (let rowOffset = 0; rowOffset < clipboardRowCount; rowOffset++) {
            const cellValue = rows[rowOffset][0];
            
            for (let colOffset = 0; colOffset < selectionColCount; colOffset++) {
              const targetRow = startRow + rowOffset;
              const targetCol = startCol + colOffset;
              
              // テーブルの範囲内かチェック
              if (targetRow < tableData.length && targetCol < tableData[0].length) {
                updateCell(targetRow, targetCol, cellValue);
              }
            }
          }
        }
      } else {
        // 通常のペースト
        rows.forEach((row, rowOffset) => {
          row.forEach((cellValue, colOffset) => {
            const targetRow = startRow + rowOffset;
            const targetCol = startCol + colOffset;
            
            // テーブルの範囲内かチェック
            if (targetRow < tableData.length && targetCol < tableData[0].length) {
              updateCell(targetRow, targetCol, cellValue);
            }
          });
        });
      }
    } catch (err) {
      console.error('クリップボードからの読み取りに失敗しました:', err);
    }
  }, [currentCell, tableData, updateCell, addRow, addColumn, selectedCells, parseCellValueFromExcel, getSelectedCellPositions]);

  return {
    copySelectedCells,
    cutSelectedCells,
    pasteToSelectedCells
  }
} 