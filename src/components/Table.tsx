import { FC, useRef, useEffect, MouseEvent } from 'react'
import { Cell } from './Cell'
import { TableData } from '../types/table'
import styles from './Table.module.css'
import { useTableData } from '../hooks/useTableData'
import { useTableSelection } from '../hooks/useTableSelection'
import { useClipboard } from '../hooks/useClipboard'
import { useCellEditing } from '../hooks/useCellEditing'
import { useKeyboardEvents } from '../hooks/useKeyboardEvents'

type TableProps = {
  initialData: TableData
}

export const Table: FC<TableProps> = ({ initialData }) => {
  const tableRef = useRef<HTMLDivElement>(null)
  
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
  
  // セル編集の管理
  const { 
    isEditing,
    startEditing, 
    stopEditing,
    handleCompositionStart,
    handleCompositionEnd
  } = useCellEditing(data, currentCell, updateCell)
  
  // クリップボード操作の管理
  const { 
    copySelectedCells, 
    pasteToSelectedCells
  } = useClipboard(data, selection, updateCell)

  // 選択されたセルをクリア
  const clearSelectedCells = () => {
    if (!selection) return
    
    const positions = getSelectedCellPositions()
    updateMultipleCells(positions, '')
  }
  
  // キーボードイベントの管理
  useKeyboardEvents(data, {
    moveSelection,
    setShiftKey,
    copySelectedCells: () => {
      copySelectedCells()
    },
    pasteToSelectedCells: () => {
      pasteToSelectedCells()
    },
    startEditing: () => {
      startEditing()
    },
    stopEditing: (save = true) => {
      stopEditing(save)
    },
    clearSelectedCells,
    isEditing
  })

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
          <td key={colIndex} className={styles.cell}>
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
          <button onClick={() => copySelectedCells()} className={styles.toolbarButton} disabled={!selection} title="コピー">
            コピー
          </button>
          <button 
            onClick={() => {
              if (currentCell) {
                pasteToSelectedCells()
              }
            }} 
            className={styles.toolbarButton} 
            disabled={!currentCell}
            title="ペースト"
          >
            ペースト
          </button>
          <button 
            onClick={clearSelectedCells} 
            className={styles.toolbarButton} 
            disabled={!selection}
            title="クリア"
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
        <table className={styles.table}>
          <tbody>
            {renderRows()}
          </tbody>
        </table>
      </div>
    </div>
  )
} 