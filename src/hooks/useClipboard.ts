import { useCallback } from 'react'
import { TableData, Selection, Position, HistoryActionType } from '../types/table'

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
      const rows = text.split('\n').filter(row => row.trim() !== '')
      
      const startRow = currentCell.row
      const startCol = currentCell.col
      
      // 必要に応じて行を追加
      if (addRow && startRow + rows.length > tableData.length) {
        const rowsToAdd = startRow + rows.length - tableData.length
        for (let i = 0; i < rowsToAdd; i++) {
          addRow()
        }
      }
      
      // 必要に応じて列を追加
      const maxCols = Math.max(...rows.map(row => row.split('\t').length))
      if (addColumn && startCol + maxCols > tableData[0].length) {
        const colsToAdd = startCol + maxCols - tableData[0].length
        for (let i = 0; i < colsToAdd; i++) {
          addColumn()
        }
      }
      
      // データをペースト
      rows.forEach((row, rowOffset) => {
        const cells = row.split('\t')
        cells.forEach((cellValue, colOffset) => {
          const targetRow = startRow + rowOffset
          const targetCol = startCol + colOffset
          
          // テーブルの範囲内かチェック
          if (targetRow < tableData.length && targetCol < tableData[0].length) {
            updateCell(targetRow, targetCol, cellValue)
          }
        })
      })
    } catch (err) {
      console.error('クリップボードからの読み取りに失敗しました:', err)
    }
  }, [currentCell, tableData, updateCell, addRow, addColumn])

  return {
    copySelectedCells,
    cutSelectedCells,
    pasteToSelectedCells
  }
} 