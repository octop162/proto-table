import { useState, useCallback, useRef } from 'react'
import { Position, Selection, TableData } from '../types/table'

/**
 * テーブルの選択状態を管理するカスタムフック
 * @returns 選択状態と操作関数
 */
export const useTableSelection = (data: TableData) => {
  const [currentCell, setCurrentCell] = useState<Position | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [selectionAnchor, setSelectionAnchor] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<Position | null>(null)

  /**
   * セルが選択されているかどうかを判定
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   * @returns 選択されているかどうか
   */
  const isCellSelected = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!selection) return false

    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol
  }, [selection])

  /**
   * セルが編集モードかどうかを判定
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   * @returns 編集モードかどうか
   */
  const isCellEditing = useCallback((rowIndex: number, colIndex: number): boolean => {
    return currentCell?.row === rowIndex && currentCell?.col === colIndex
  }, [currentCell])

  /**
   * セルを選択
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   */
  const selectCell = useCallback((rowIndex: number, colIndex: number) => {
    // 現在のセルを更新
    setCurrentCell({ row: rowIndex, col: colIndex })
    
    if (isShiftPressed && selectionAnchor) {
      // Shiftキーが押されている場合は範囲選択
      setSelection({
        start: selectionAnchor,
        end: { row: rowIndex, col: colIndex }
      })
    } else {
      // 単一選択
      const newPosition = { row: rowIndex, col: colIndex }
      setSelectionAnchor(newPosition)
      setSelection({
        start: newPosition,
        end: newPosition
      })
    }
  }, [selectionAnchor, isShiftPressed])

  /**
   * マウスダウンイベントのハンドラー
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   * @param shiftKey Shiftキーが押されているかどうか
   */
  const handleMouseDown = useCallback((rowIndex: number, colIndex: number, shiftKey = false) => {
    const position = { row: rowIndex, col: colIndex }
    
    // Shiftキーが押されている場合は選択範囲を拡張
    if (shiftKey && selectionAnchor) {
      setCurrentCell(position)
      setSelection({
        start: selectionAnchor,
        end: position
      })
      // ドラッグ開始位置を設定（Shiftキーでの選択でもドラッグを可能にする）
      dragStartRef.current = position
      setIsDragging(true)
    } else {
      // 通常のクリック（単一選択）
      dragStartRef.current = position
      setIsDragging(true)
      
      // 現在のセルを更新
      setCurrentCell(position)
      
      // 単一選択で開始
      setSelectionAnchor(position)
      setSelection({
        start: position,
        end: position
      })
    }
  }, [selectionAnchor])

  /**
   * マウスムーブイベントのハンドラー
   * @param rowIndex 行インデックス
   * @param colIndex 列インデックス
   */
  const handleMouseMove = useCallback((rowIndex: number, colIndex: number) => {
    if (!isDragging || !dragStartRef.current) return
    
    // ドラッグ中は選択範囲を更新
    setCurrentCell({ row: rowIndex, col: colIndex })
    
    // ドラッグ中はアンカーを維持して選択範囲を更新
    const anchor = selectionAnchor || dragStartRef.current
    setSelection({
      start: anchor,
      end: { row: rowIndex, col: colIndex }
    })
  }, [isDragging, selectionAnchor])

  /**
   * マウスアップイベントのハンドラー
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragStartRef.current = null
  }, [])

  /**
   * 選択を解除
   */
  const clearSelection = useCallback(() => {
    setCurrentCell(null)
    setSelection(null)
    setSelectionAnchor(null)
    setIsDragging(false)
    dragStartRef.current = null
  }, [])

  /**
   * Shiftキーの状態を設定
   * @param pressed 押されているかどうか
   */
  const setShiftKey = useCallback((pressed: boolean) => {
    setIsShiftPressed(pressed)
  }, [])

  /**
   * 選択範囲を移動
   * @param direction 移動方向
   */
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentCell) return

    const { row, col } = currentCell
    let newRow = row
    let newCol = col

    switch (direction) {
      case 'up':
        if (row > 0) newRow = row - 1
        break
      case 'down':
        if (row < data.length - 1) newRow = row + 1
        break
      case 'left':
        if (col > 0) newCol = col - 1
        break
      case 'right':
        if (col < data[0].length - 1) newCol = col + 1
        break
    }

    // 現在のセルを更新
    setCurrentCell({ row: newRow, col: newCol })
    
    if (isShiftPressed) {
      // Shiftキーが押されている場合は選択範囲を拡大/縮小
      if (!selectionAnchor && selection) {
        // 初回のShift+移動の場合、現在の選択範囲の開始位置をアンカーとして設定
        setSelectionAnchor(selection.start)
      }
      
      const anchor = selectionAnchor || (selection ? selection.start : { row: newRow, col: newCol })
      
      setSelection({
        start: anchor,
        end: { row: newRow, col: newCol }
      })
    } else {
      // 単一選択
      const newPosition = { row: newRow, col: newCol }
      setSelectionAnchor(newPosition)
      setSelection({
        start: newPosition,
        end: newPosition
      })
    }
  }, [currentCell, data, isShiftPressed, selectionAnchor, selection])

  /**
   * 選択範囲内のすべてのセルの位置を取得
   * @returns 選択範囲内のセルの位置の配列
   */
  const getSelectedCellPositions = useCallback((): Position[] => {
    if (!selection) return []

    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    const positions: Position[] = []
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        positions.push({ row, col })
      }
    }

    return positions
  }, [selection])

  return {
    currentCell,
    selection,
    isShiftPressed,
    isDragging,
    isCellSelected,
    isCellEditing,
    selectCell,
    clearSelection,
    setShiftKey,
    moveSelection,
    getSelectedCellPositions,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
} 