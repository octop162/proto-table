import { useState, useCallback } from 'react'
import { TableData, CellData, Position, HistoryActionType } from '../types/table'
import { calculateColumnWidths } from '../utils/cellWidthCalculator'
import { useTableHistory } from './useTableHistory'

/**
 * テーブルデータを管理するカスタムフック
 * @param initialData 初期データ
 * @returns テーブルデータと操作関数
 */
export const useTableData = (initialData: TableData) => {
  const [data, setData] = useState<TableData>(initialData)
  
  // 履歴管理フックを初期化
  const { 
    addHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useTableHistory(initialData)

  /**
   * データを更新し、履歴に追加する
   * @param newData 新しいテーブルデータ
   * @param actionType アクションの種類
   */
  const updateDataWithHistory = useCallback((newData: TableData, actionType: HistoryActionType) => {
    setData(newData)
    addHistory(actionType, newData)
  }, [addHistory])

  /**
   * セルの値を更新
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   * @param value 新しい値
   */
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: CellData['value']) => {
    const newData = [...data]
    newData[rowIndex][colIndex] = {
      ...newData[rowIndex][colIndex],
      value
    }
    updateDataWithHistory(newData, HistoryActionType.CELL_UPDATE)
  }, [data, updateDataWithHistory])

  /**
   * 複数のセルの値を更新
   * @param positions 更新するセルの位置の配列
   * @param value 新しい値
   */
  const updateMultipleCells = useCallback((positions: Position[], value: CellData['value']) => {
    const newData = [...data]
    positions.forEach(({ row, col }) => {
      newData[row][col] = {
        ...newData[row][col],
        value
      }
    })
    updateDataWithHistory(newData, HistoryActionType.MULTIPLE_CELLS_UPDATE)
  }, [data, updateDataWithHistory])

  /**
   * セルの幅を設定
   * @param colIndex 列インデックス
   * @param width 幅（px）
   */
  const setCellWidth = useCallback((colIndex: number, width: number) => {
    const newData = [...data]
    for (let rowIndex = 0; rowIndex < newData.length; rowIndex++) {
      newData[rowIndex][colIndex] = {
        ...newData[rowIndex][colIndex],
        width
      }
    }
    setData(newData) // 幅の変更は履歴に追加しない
  }, [data])

  /**
   * 全てのセルの幅を内容に合わせて自動調整
   */
  const updateAllCellWidths = useCallback(() => {
    const columnWidths = calculateColumnWidths(data)
    const newData = [...data]
    
    for (let colIndex = 0; colIndex < columnWidths.length; colIndex++) {
      for (let rowIndex = 0; rowIndex < newData.length; rowIndex++) {
        newData[rowIndex][colIndex] = {
          ...newData[rowIndex][colIndex],
          width: columnWidths[colIndex]
        }
      }
    }
    
    setData(newData) // 幅の変更は履歴に追加しない
  }, [data])

  /**
   * 行を追加
   */
  const addRow = useCallback(() => {
    // 最後の行のセル幅を取得
    const lastRowWidths = data.length > 0 
      ? data[0].map(cell => cell.width || 80)
      : Array(data[0].length).fill(80)
    
    const newRow = Array(data[0].length).fill(null).map((_, index) => ({
      value: '',
      isEditing: false,
      width: lastRowWidths[index] // 前の行と同じ幅を設定
    }))
    
    const newData = [...data, newRow]
    updateDataWithHistory(newData, HistoryActionType.ADD_ROW)
  }, [data, updateDataWithHistory])

  /**
   * 列を追加
   */
  const addColumn = useCallback(() => {
    const newData = data.map(row => [
      ...row,
      {
        value: '',
        isEditing: false,
        width: 80 // デフォルト幅
      }
    ])
    
    updateDataWithHistory(newData, HistoryActionType.ADD_COLUMN)
  }, [data, updateDataWithHistory])

  /**
   * 行を削除
   */
  const removeRow = useCallback(() => {
    if (data.length <= 1) return
    
    const newData = [...data]
    newData.pop()
    updateDataWithHistory(newData, HistoryActionType.REMOVE_ROW)
  }, [data, updateDataWithHistory])

  /**
   * 列を削除
   */
  const removeColumn = useCallback(() => {
    if (data[0].length <= 1) return
    
    const newData = data.map(row => {
      const newRow = [...row]
      newRow.pop()
      return newRow
    })
    
    updateDataWithHistory(newData, HistoryActionType.REMOVE_COLUMN)
  }, [data, updateDataWithHistory])

  /**
   * 文字列データをテーブルにペースト
   * @param text ペーストするテキスト
   * @param startRow 開始行
   * @param startCol 開始列
   */
  const pasteData = useCallback((text: string, startRow: number, startCol: number) => {
    const rows = text.split('\n').filter(row => row.trim() !== '')
    const newData = [...data]

    rows.forEach((row, rowOffset) => {
      const cells = row.split('\t')
      cells.forEach((cellValue, colOffset) => {
        const targetRow = startRow + rowOffset
        const targetCol = startCol + colOffset

        // テーブルの範囲内かチェック
        if (targetRow < newData.length && targetCol < newData[0].length) {
          newData[targetRow][targetCol] = {
            ...newData[targetRow][targetCol],
            value: cellValue
          }
        }
      })
    })

    updateDataWithHistory(newData, HistoryActionType.PASTE)
  }, [data, updateDataWithHistory])

  /**
   * 選択範囲のデータをコピー
   * @param startPos 開始位置
   * @param endPos 終了位置
   * @returns コピーしたデータの文字列
   */
  const copyData = useCallback((startPos: Position, endPos: Position): string => {
    const minRow = Math.min(startPos.row, endPos.row)
    const maxRow = Math.max(startPos.row, endPos.row)
    const minCol = Math.min(startPos.col, endPos.col)
    const maxCol = Math.max(startPos.col, endPos.col)

    let result = ''
    for (let i = minRow; i <= maxRow; i++) {
      const rowData = []
      for (let j = minCol; j <= maxCol; j++) {
        rowData.push(data[i][j].value)
      }
      result += rowData.join('\t') + '\n'
    }

    return result
  }, [data])

  /**
   * 元に戻す
   */
  const undoAction = useCallback(() => {
    const prevData = undo()
    if (prevData) {
      setData(prevData)
    }
  }, [undo])

  /**
   * やり直す
   */
  const redoAction = useCallback(() => {
    const nextData = redo()
    if (nextData) {
      setData(nextData)
    }
  }, [redo])

  return {
    data,
    updateCell,
    updateMultipleCells,
    setCellWidth,
    updateAllCellWidths,
    addRow,
    addColumn,
    removeRow,
    removeColumn,
    pasteData,
    copyData,
    undoAction,
    redoAction,
    canUndo,
    canRedo
  }
} 