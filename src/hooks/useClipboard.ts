import { useCallback } from 'react'
import { Selection, TableData } from '../types/table'

/**
 * コピー＆ペースト機能を管理するカスタムフック
 */
export const useClipboard = (
  data: TableData,
  selection: Selection | null,
  updateCell: (rowIndex: number, colIndex: number, value: string) => void,
  updateMultipleCells?: (positions: { row: number, col: number }[], value: string) => void
) => {
  /**
   * 選択範囲のデータをコピー
   * @returns コピーしたデータの文字列
   */
  const copySelectedCells = useCallback((): string => {
    if (!selection) return ''

    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    let result = ''
    for (let i = minRow; i <= maxRow; i++) {
      const rowData = []
      for (let j = minCol; j <= maxCol; j++) {
        rowData.push(data[i][j].value)
      }
      result += rowData.join('\t') + '\n'
    }

    // クリップボードにコピー
    navigator.clipboard.writeText(result).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err)
    })

    return result
  }, [data, selection])

  /**
   * 選択範囲のデータをカット
   * @returns カットしたデータの文字列
   */
  const cutSelectedCells = useCallback((): string => {
    if (!selection) return ''

    // まずデータをコピー
    const copiedData = copySelectedCells()

    // 選択範囲のセルをクリア
    const { start, end } = selection
    const minRow = Math.min(start.row, end.row)
    const maxRow = Math.max(start.row, end.row)
    const minCol = Math.min(start.col, end.col)
    const maxCol = Math.max(start.col, end.col)

    if (updateMultipleCells) {
      // 複数セルを一度に更新する関数が提供されている場合はそれを使用
      const positions = []
      for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCol; j <= maxCol; j++) {
          positions.push({ row: i, col: j })
        }
      }
      updateMultipleCells(positions, '')
    } else {
      // 個別に更新
      for (let i = minRow; i <= maxRow; i++) {
        for (let j = minCol; j <= maxCol; j++) {
          updateCell(i, j, '')
        }
      }
    }

    return copiedData
  }, [copySelectedCells, selection, updateCell, updateMultipleCells])

  /**
   * クリップボードからデータをペースト
   */
  const pasteToSelectedCells = useCallback(async () => {
    if (!selection) return

    try {
      const text = await navigator.clipboard.readText()
      const rows = text.split('\n').filter(row => row.trim() !== '')
      const { start } = selection

      rows.forEach((row, rowIndex) => {
        const cells = row.split('\t')
        cells.forEach((cell, colIndex) => {
          const targetRow = start.row + rowIndex
          const targetCol = start.col + colIndex

          // テーブルの範囲内かチェック
          if (targetRow < data.length && targetCol < data[0].length) {
            updateCell(targetRow, targetCol, cell)
          }
        })
      })
    } catch (err) {
      console.error('クリップボードからの読み取りに失敗しました:', err)
    }
  }, [data, selection, updateCell])

  /**
   * 文字列データをテーブルにペースト
   * @param text ペーストするテキスト
   * @param startRow 開始行
   * @param startCol 開始列
   */
  const pasteData = useCallback(
    (text: string, startRow: number, startCol: number) => {
      const rows = text.split('\n').filter(row => row.trim() !== '')

      rows.forEach((row, rowIndex) => {
        const cells = row.split('\t')
        cells.forEach((cell, colIndex) => {
          const targetRow = startRow + rowIndex
          const targetCol = startCol + colIndex

          // テーブルの範囲内かチェック
          if (targetRow < data.length && targetCol < data[0].length) {
            updateCell(targetRow, targetCol, cell)
          }
        })
      })
    },
    [data, updateCell]
  )

  return {
    copySelectedCells,
    cutSelectedCells,
    pasteToSelectedCells,
    pasteData
  }
} 