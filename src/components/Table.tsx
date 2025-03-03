import { FC, useRef, useEffect, MouseEvent, useState } from 'react'
import { Cell } from './Cell'
import { TableData } from '../types/table'
import styles from './Table.module.css'
import { useTableData } from '../hooks/useTableData'
import { useTableSelection } from '../hooks/useTableSelection'
import { useClipboard } from '../hooks/useClipboard'
import { useCellEditing } from '../hooks/useCellEditing'
import { useKeyboardEvents } from '../hooks/useKeyboardEvents'
import { ShortcutHelp } from './ShortcutHelp'

type TableProps = {
  initialData: TableData
}

export const Table: FC<TableProps> = ({ initialData }) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false)
  
  // テーブルデータの管理
  const { 
    data, 
    updateCell, 
    updateMultipleCells,
    updateAllCellWidths,
    addRow, 
    addColumn, 
    removeRow, 
    removeColumn 
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
    handleMouseUp
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

  // 初期状態ではisEditingはfalse
  const isEditingRef = useRef(false)
  
  // クリップボード操作の管理
  const { 
    copySelectedCells, 
    cutSelectedCells,
    pasteToSelectedCells
  } = useClipboard(data, selection, updateCell, updateMultipleCells)
  
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
    showShortcutHelp
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
      showShortcutHelp
    })
  }, [isEditing, startEditing, stopEditing, copySelectedCells, cutSelectedCells, pasteToSelectedCells, updateHandlers])

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
          <button onClick={() => copySelectedCells()} className={styles.toolbarButton} disabled={!selection} title="コピー (Ctrl+C)">
            コピー
          </button>
          <button onClick={() => cutSelectedCells()} className={styles.toolbarButton} disabled={!selection} title="カット (Ctrl+X)">
            カット
          </button>
          <button 
            onClick={() => {
              if (currentCell) {
                pasteToSelectedCells()
              }
            }} 
            className={styles.toolbarButton} 
            disabled={!currentCell}
            title="ペースト (Ctrl+V)"
          >
            ペースト
          </button>
          <button 
            onClick={clearSelectedCells} 
            className={styles.toolbarButton} 
            disabled={!selection}
            title="クリア (Delete)"
          >
            クリア
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button onClick={() => addRow()} className={styles.toolbarButton} title="行を追加">
            行を追加
          </button>
          <button onClick={() => removeRow()} className={styles.toolbarButton} disabled={data.length <= 1} title="行を削除">
            行を削除
          </button>
          <button onClick={() => addColumn()} className={styles.toolbarButton} title="列を追加">
            列を追加
          </button>
          <button onClick={() => removeColumn()} className={styles.toolbarButton} disabled={data[0].length <= 1} title="列を削除">
            列を削除
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <button 
            onClick={() => updateAllCellWidths()} 
            className={styles.toolbarButton} 
            title="幅を更新"
          >
            幅を更新
          </button>
          <button 
            onClick={showShortcutHelp} 
            className={styles.toolbarButton} 
            title="ショートカット (Shift+?)"
          >
            ショートカット
          </button>
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

      <ShortcutHelp 
        isOpen={isShortcutHelpOpen} 
        onClose={() => setIsShortcutHelpOpen(false)} 
      />
    </div>
  )
} 