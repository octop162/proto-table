import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useClipboard } from './useClipboard'
import { TableData } from '../types/table'

describe('useClipboard', () => {
  let mockTableData: TableData
  const mockUpdateCell = vi.fn()
  const mockUpdateMultipleCells = vi.fn()
  const mockAddRow = vi.fn()
  const mockAddColumn = vi.fn()
  
  beforeEach(() => {
    mockTableData = [
      [{ value: 'A1', isEditing: false }, { value: 'B1', isEditing: false }, { value: 'C1', isEditing: false }],
      [{ value: 'A2', isEditing: false }, { value: 'B2', isEditing: false }, { value: 'C2', isEditing: false }],
      [{ value: 'A3', isEditing: false }, { value: 'B3', isEditing: false }, { value: 'C3', isEditing: false }]
    ]
    
    vi.clearAllMocks()
    
    // モックNavigator Clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\tY1\nX2\tY2')
      },
      configurable: true
    })
  })
  
  it('copySelectedCells: 選択範囲のセルをコピーできること', async () => {
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    result.current.copySelectedCells()
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A1\tB1\nA2\tB2\n')
  })
  
  it('formatCellValueForExcel: 異なる改行コード（CR、CRLF）が正しく処理されること', async () => {
    // テスト用のデータを作成（CRLFとCRを含む）
    const mockTableDataWithDifferentLineBreaks: TableData = [
      [{ value: 'A1\r\nB1', isEditing: false }, { value: 'C1\rD1', isEditing: false }]
    ]
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableDataWithDifferentLineBreaks,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 1 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    result.current.copySelectedCells()
    
    // 改行コードが正規化され、適切にフォーマットされていることを確認
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('"A1\nB1"\t"C1\nD1"\n')
  })

  it('pasteToSelectedCells: 異なる改行コード（CR、CRLF）が正しく処理されること', async () => {
    // モックNavigator Clipboard APIを上書き（CRLFとCRを含む）
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\r\nY1\tZ1\rW1')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 実際の呼び出し順序と引数を確認
    expect(mockUpdateCell).toHaveBeenNthCalledWith(1, 0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenNthCalledWith(2, 1, 0, 'Y1')
    expect(mockUpdateCell).toHaveBeenNthCalledWith(3, 1, 1, 'Z1')
    expect(mockUpdateCell).toHaveBeenNthCalledWith(4, 2, 0, 'W1')
  })
  
  it('cutSelectedCells: 選択範囲のセルをカットできること', async () => {
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    result.current.cutSelectedCells()
    
    // コピーされたことを確認
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A1\tB1\nA2\tB2\n')
    
    // セルがクリアされたことを確認
    expect(mockUpdateMultipleCells).toHaveBeenCalledWith(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
      ],
      ''
    )
  })
  
  it('pasteToSelectedCells: 選択されたセルにペーストできること', async () => {
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // ペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'Y2')
  })
  
  it('pasteToSelectedCells: 必要に応じて行が追加されること', async () => {
    // 3行のテーブルに4行のデータをペースト
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\nX2\nX3\nX4')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 行が追加されたことを確認
    expect(mockAddRow).toHaveBeenCalledTimes(1)
  })
  
  it('pasteToSelectedCells: 必要に応じて列が追加されること', async () => {
    // 3列のテーブルに4列のデータをペースト
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\tY1\tZ1\tW1')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 列が追加されたことを確認
    expect(mockAddColumn).toHaveBeenCalledTimes(1)
  })
  
  it('pasteToSelectedCells: 単一セルのコピーを複数選択したセルにペーストできること', async () => {
    // 単一セルのデータ
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 1 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 選択した全てのセルに同じ値がペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'X1')
  })
  
  it('pasteToSelectedCells: 横一列のデータを縦に繰り返しペーストできること', async () => {
    // 横一列のデータ
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\tY1')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 1 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 横一列のデータが縦に繰り返しペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 1, 'Y1')
  })
  
  it('pasteToSelectedCells: 縦一列のデータを横に繰り返しペーストできること', async () => {
    // 縦一列のデータ
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\nX2')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 1, col: 2 }
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 縦一列のデータが横に繰り返しペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 2, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 2, 'X2')
  })

  it('pasteToSelectedCells: セル内改行を含むデータを正しくペーストできること', async () => {
    // セル内改行を含むデータ（より単純なケース）
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('"Line1\nLine2"')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // セル内改行を含むデータが正しくペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'Line1\nLine2')
  })

  it('pasteToSelectedCells: 複数のセルと改行を含むデータを正しくペーストできること', async () => {
    // テスト前にモックをクリア
    vi.clearAllMocks()
    
    // 複数のセルと改行を含むデータ
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('"Line1\nLine2"\tB1\n"C1\nC2\nC3"\tD1')
      },
      configurable: true
    })
    
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 複数のセルと改行を含むデータが正しくペーストされたことを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'Line1\nLine2')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'B1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'C1\nC2\nC3')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'D1')
  })
}) 