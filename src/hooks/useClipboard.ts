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
        rowData.push(tableData[row][col].value)
      }
      text += rowData.join('\t') + '\n'
    }

    navigator.clipboard.writeText(text)
  }, [selectedCells, tableData])

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
      // 末尾の改行を除去しつつ、空の行も保持する
      const rows = text.endsWith('\n') 
        ? text.slice(0, -1).split('\n') 
        : text.split('\n');
      
      // クリップボードデータの行数と列数を取得
      const clipboardRowCount = rows.length;
      const clipboardColCount = Math.max(...rows.map(row => row.split('\t').length));
      
      // クリップボードデータが横一列または縦一列かどうかを判定
      const isSingleRow = clipboardRowCount === 1 && clipboardColCount > 1;
      const isSingleColumn = clipboardColCount === 1 && clipboardRowCount > 1;
      
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
         (isSingleColumn && selectionColCount > 1));
      
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
        if (isSingleRow) {
          // 横一列のデータを縦に繰り返す場合
          const cells = rows[0].split('\t');
          
          for (let rowOffset = 0; rowOffset < selectionRowCount; rowOffset++) {
            cells.forEach((cellValue, colOffset) => {
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
            const cellValue = rows[rowOffset].split('\t')[0];
            
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
          const cells = row.split('\t');
          cells.forEach((cellValue, colOffset) => {
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
  }, [currentCell, tableData, updateCell, addRow, addColumn, selectedCells]);

  return {
    copySelectedCells,
    cutSelectedCells,
    pasteToSelectedCells
  }
} 