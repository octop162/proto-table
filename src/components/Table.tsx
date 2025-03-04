import { FC, useRef, useEffect, MouseEvent, useState, useCallback } from 'react'
import { Cell } from './Cell'
import { TableData } from '../types/table'
import styles from './Table.module.css'
import { useTableData } from '../hooks/useTableData'
import { useTableSelection } from '../hooks/useTableSelection'
import { useClipboard } from '../hooks/useClipboard'
import { useCellEditing } from '../hooks/useCellEditing'
import { useKeyboardEvents } from '../hooks/useKeyboardEvents'
import { ShortcutHelp } from './ShortcutHelp'
import { convertToMarkdown } from '../utils/markdownConverter'
import { IconButton } from './IconButton'
import { IconType } from '../types/icons'

type TableProps = {
  initialData: TableData
}

export const Table: FC<TableProps> = ({ initialData }) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false)
  const [markdownCopied, setMarkdownCopied] = useState(false)
  
  // テーブルデータの管理
  const { 
    data, 
    updateCell, 
    updateMultipleCells,
    updateAllCellWidths,
    addRow, 
    addColumn, 
    removeRow, 
    removeColumn,
    undoAction,
    redoAction,
    canUndo,
    canRedo
  } = useTableData(initialData)
  
  // 初期表示時にセル幅を自動調整
  useEffect(() => {
    updateAllCellWidths()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 選択状態の管理
  const { 
    currentCell, 
    selection, 
    isCellSelected, 
    isCellEditing, 
    selectCell, 
    setShiftKey, 
    moveSelection,
    getSelectedCellPositions,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
    selectAllCells
  } = useTableSelection(data)
  
  // 選択されたセルをクリア
  const clearSelectedCells = () => {
    if (!selection) return
    
    const positions = getSelectedCellPositions()
    updateMultipleCells(positions, '')
  }

  // ショートカットヘルプを表示
  const showShortcutHelp = () => {
    setIsShortcutHelpOpen(true)
  }

  // クリップボード操作の管理
  const { 
    copySelectedCells, 
    cutSelectedCells,
    pasteToSelectedCells
  } = useClipboard({
    tableData: data, 
    selectedCells: selection, 
    currentCell,
    updateCell, 
    updateMultipleCells,
    addRow,
    addColumn
  })

  // 行を安全に削除（選択状態を考慮）
  const safeRemoveRow = () => {
    if (data.length <= 1) return

    // 最後の行が選択されているかチェック
    const lastRowIndex = data.length - 1
    const isLastRowSelected = selection && 
      (Math.min(selection.start.row, selection.end.row) <= lastRowIndex && 
       Math.max(selection.start.row, selection.end.row) >= lastRowIndex)

    // 最後の行が選択されている場合は選択を解除
    if (isLastRowSelected) {
      clearSelection()
    }

    // 行を削除
    removeRow()
  }

  // 列を安全に削除（選択状態を考慮）
  const safeRemoveColumn = () => {
    if (data[0].length <= 1) return

    // 最後の列が選択されているかチェック
    const lastColIndex = data[0].length - 1
    const isLastColSelected = selection && 
      (Math.min(selection.start.col, selection.end.col) <= lastColIndex && 
       Math.max(selection.start.col, selection.end.col) >= lastColIndex)

    // 最後の列が選択されている場合は選択を解除
    if (isLastColSelected) {
      clearSelection()
    }

    // 列を削除
    removeColumn()
  }

  // Markdownとしてクリップボードにコピー
  const copyAsMarkdown = useCallback(() => {
    if (!data || data.length === 0) return
    
    // 常に全体をコピー
    const markdown = convertToMarkdown(data)
    navigator.clipboard.writeText(markdown)
    
    setMarkdownCopied(true)
    setTimeout(() => setMarkdownCopied(false), 2000)
  }, [data])

  // 初期状態ではisEditingはfalse
  const isEditingRef = useRef(false)
  
  // キーボードイベントの管理（初期設定）
  const { getPendingKey, updateHandlers } = useKeyboardEvents(data, {
    moveSelection,
    setShiftKey,
    copySelectedCells,
    cutSelectedCells,
    pasteToSelectedCells,
    startEditing: () => {},  // 後で上書き
    stopEditing: () => {},  // 後で上書き
    clearSelectedCells,
    isEditing: isEditingRef.current,  // 初期状態
    showShortcutHelp,
    undo: undoAction,
    redo: redoAction,
    selectAllCells,
    clearSelection
  })
  
  // セル編集の管理
  const { 
    isEditing,
    startEditing, 
    stopEditing,
    handleCompositionStart,
    handleCompositionEnd
  } = useCellEditing(data, currentCell, updateCell, getPendingKey)
  
  // ハンドラーを更新
  useEffect(() => {
    updateHandlers({
      isEditing,
      startEditing,
      stopEditing,
      copySelectedCells,
      cutSelectedCells,
      pasteToSelectedCells,
      showShortcutHelp,
      undo: undoAction,
      redo: redoAction,
      selectAllCells,
      clearSelection
    })
  }, [isEditing, startEditing, stopEditing, copySelectedCells, cutSelectedCells, pasteToSelectedCells, updateHandlers, undoAction, redoAction, selectAllCells, clearSelection])

  // マウスダウンイベントハンドラー（Shiftキーの状態を取得）
  const handleCellMouseDown = (rowIndex: number, colIndex: number, e: MouseEvent) => {
    handleMouseDown(rowIndex, colIndex, e.shiftKey)
  }

  // セルのレンダリング
  const renderCell = (rowIndex: number, colIndex: number) => {
    const cell = data[rowIndex][colIndex]
    const selected = isCellSelected(rowIndex, colIndex)
    const editing = isCellEditing(rowIndex, colIndex) && isEditing

    return (
      <Cell
        key={`${rowIndex}-${colIndex}`}
        value={cell.value}
        isEditing={editing}
        isSelected={selected}
        width={cell.width}
        onEdit={(value) => updateCell(rowIndex, colIndex, value)}
        onSelect={() => selectCell(rowIndex, colIndex)}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onDoubleClick={() => startEditing()}
        onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
        onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
        onMouseEnter={() => handleMouseMove(rowIndex, colIndex)}
        onMouseUp={handleMouseUp}
      />
    )
  }

  // 行を生成
  const renderRows = () => {
    return data.map((row, rowIndex) => (
      <tr key={rowIndex}>
        {row.map((_, colIndex) => (
          <td key={colIndex} className={styles.cell} style={{ padding: 0, borderSpacing: 0 }}>
            {renderCell(rowIndex, colIndex)}
          </td>
        ))}
      </tr>
    ))
  }

  // ツールバーを生成
  const renderToolbar = () => {
    return (
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <IconButton 
            iconType={IconType.COPY} 
            onClick={copySelectedCells} 
            disabled={!selection} 
            title="コピー (Ctrl+C)" 
          />
          <IconButton 
            iconType={IconType.CUT} 
            onClick={cutSelectedCells} 
            disabled={!selection} 
            title="カット (Ctrl+X)" 
          />
          <IconButton 
            iconType={IconType.PASTE} 
            onClick={() => {
              if (currentCell) {
                pasteToSelectedCells()
              }
            }} 
            disabled={!currentCell} 
            title="ペースト (Ctrl+V)" 
          />
          <IconButton 
            iconType={IconType.MARKDOWN} 
            onClick={copyAsMarkdown} 
            title="Markdownとしてコピー" 
          />
          <IconButton 
            iconType={IconType.SELECT_ALL} 
            onClick={selectAllCells} 
            title="すべて選択 (Ctrl+A)" 
          />
          <IconButton 
            iconType={IconType.CLEAR_SELECTION} 
            onClick={clearSelection} 
            disabled={!selection} 
            title="選択解除 (Esc)" 
          />
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <IconButton 
            iconType={IconType.ADD_ROW} 
            onClick={() => addRow()} 
            title="行を追加" 
          />
          <IconButton 
            iconType={IconType.REMOVE_ROW} 
            onClick={safeRemoveRow} 
            disabled={data.length <= 1} 
            title="行を削除" 
          />
          <IconButton 
            iconType={IconType.ADD_COLUMN} 
            onClick={() => addColumn()} 
            title="列を追加" 
          />
          <IconButton 
            iconType={IconType.REMOVE_COLUMN} 
            onClick={safeRemoveColumn} 
            disabled={data[0].length <= 1} 
            title="列を削除" 
          />
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <IconButton 
            iconType={IconType.UNDO} 
            onClick={undoAction} 
            disabled={!canUndo} 
            title="元に戻す (Ctrl+Z)" 
          />
          <IconButton 
            iconType={IconType.REDO} 
            onClick={redoAction} 
            disabled={!canRedo} 
            title="やり直し (Ctrl+Y)" 
          />
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <IconButton 
            iconType={IconType.UPDATE_WIDTH} 
            onClick={() => updateAllCellWidths()} 
            title="幅を更新" 
          />
          <IconButton 
            iconType={IconType.SHORTCUT} 
            onClick={showShortcutHelp} 
            title="ショートカット (Shift+?)" 
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={tableRef}
      tabIndex={-1}
      className={styles.tableWrapper}
      onMouseUp={handleMouseUp}
    >
      {renderToolbar()}
      
      <div className={styles.tableContainer}>
        <table className={styles.table} cellSpacing="0" cellPadding="0">
          <tbody>
            {renderRows()}
          </tbody>
        </table>
      </div>

      {markdownCopied && (
        <div className={styles.notification}>
          Markdownとしてコピーしました
        </div>
      )}

      <ShortcutHelp 
        isOpen={isShortcutHelpOpen} 
        onClose={() => setIsShortcutHelpOpen(false)} 
      />
    </div>
  )
} 