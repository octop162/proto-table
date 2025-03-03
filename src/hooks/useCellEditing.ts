import { useState, useCallback, useEffect, useRef } from 'react'
import { Position, TableData } from '../types/table'

/**
 * セル編集機能を管理するカスタムフック
 */
export const useCellEditing = (
  data: TableData,
  currentCell: Position | null,
  updateCell: (rowIndex: number, colIndex: number, value: string) => void
) => {
  const [editValue, setEditValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const isComposingRef = useRef(false)
  const prevCellRef = useRef<Position | null>(null)
  const initialEditValueRef = useRef<string>('')

  // 現在のセルが変わったときに編集状態をリセット
  useEffect(() => {
    if (currentCell && !isEditing) {
      const { row, col } = currentCell
      const cellValue = data[row][col].value
      const stringValue = cellValue !== undefined ? String(cellValue) : ''
      setEditValue(stringValue)
      initialEditValueRef.current = stringValue
    }

    // 編集中に別のセルに移動した場合、前のセルの編集を終了して保存
    // IME入力中は処理しない
    if (!isComposingRef.current && isEditing && currentCell && prevCellRef.current && 
        (prevCellRef.current.row !== currentCell.row || prevCellRef.current.col !== currentCell.col)) {
      const { row, col } = prevCellRef.current
      updateCell(row, col, editValue)
      setIsEditing(false)
    }

    // 現在のセルを記録
    prevCellRef.current = currentCell
  }, [currentCell, data, isEditing, editValue, updateCell])

  /**
   * 編集を開始
   */
  const startEditing = useCallback(() => {
    if (!currentCell) return

    const { row, col } = currentCell
    // 値を文字列に変換して設定
    const cellValue = data[row][col].value;
    const stringValue = cellValue !== undefined ? String(cellValue) : '';
    setEditValue(stringValue);
    initialEditValueRef.current = stringValue;
    setIsEditing(true)
  }, [currentCell, data])

  /**
   * 編集を終了
   * @param save 変更を保存するかどうか
   */
  const stopEditing = useCallback((save = true) => {
    if (!currentCell || !isEditing) return
    
    // IME入力中は編集を終了しない
    if (isComposingRef.current) return

    const { row, col } = currentCell

    if (save) {
      // 変更を保存
      updateCell(row, col, editValue)
    } else {
      // 編集をキャンセルした場合は元の値に戻す
      setEditValue(initialEditValueRef.current)
    }

    setIsEditing(false)
  }, [currentCell, isEditing, editValue, updateCell])

  /**
   * 編集中の値を更新
   * @param value 新しい値
   */
  const handleEditChange = useCallback((value: string) => {
    setEditValue(value)
  }, [])

  /**
   * IME入力開始
   */
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  /**
   * IME入力終了
   */
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
  }, [])

  /**
   * 選択されたセルの値をクリア
   */
  const clearSelectedCells = useCallback(() => {
    if (!currentCell) return

    const { row, col } = currentCell
    updateCell(row, col, '')
    setEditValue('')
    initialEditValueRef.current = ''
  }, [currentCell, updateCell])

  return {
    editValue,
    isEditing,
    startEditing,
    stopEditing,
    handleEditChange,
    handleCompositionStart,
    handleCompositionEnd,
    clearSelectedCells,
    isComposing: isComposingRef.current
  }
} 