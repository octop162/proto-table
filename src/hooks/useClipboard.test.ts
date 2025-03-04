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
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A1\tB1\nA2\tB2\n')
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
  
  it('pasteToSelectedCells: クリップボードの内容をペーストできること', async () => {
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 1, col: 1 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    await result.current.pasteToSelectedCells()
    
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 2, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 1, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 2, 'Y2')
  })
  
  it('pasteToSelectedCells: 必要に応じて行と列を追加できること', async () => {
    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: null,
      currentCell: { row: 2, col: 2 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells,
      addRow: mockAddRow,
      addColumn: mockAddColumn
    }))
    
    await result.current.pasteToSelectedCells()
    
    expect(mockAddRow).toHaveBeenCalledTimes(1)
    expect(mockAddColumn).toHaveBeenCalledTimes(1)
  })

  it('pasteToSelectedCells: 空の行が詰められないこと', async () => {
    // クリップボードに空の行を含むデータをモック
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\tY1\n\nX3\tY3')
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
    
    // 1行目のデータが更新される
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'Y1')
    
    // 2行目は空行なので、空の文字列で更新される
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, '')
    
    // 3行目のデータが更新される
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 0, 'X3')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 1, 'Y3')
  })

  it('pasteToSelectedCells: 横一列のデータを複数行にペーストできること', async () => {
    // 横一列のデータをモック
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\tY1\tZ1')
      },
      configurable: true
    })

    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 2, col: 0 }  // 3行1列の選択
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 横一列のデータが3行にわたって繰り返しペーストされる
    // 1行目
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 2, 'Z1')
    
    // 2行目
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 2, 'Z1')
    
    // 3行目
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 1, 'Y1')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 2, 'Z1')
  })

  it('pasteToSelectedCells: 縦一列のデータを複数列にペーストできること', async () => {
    // 縦一列のデータをモック
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue('X1\nX2\nX3')
      },
      configurable: true
    })

    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 2 }  // 1行3列の選択
      },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))
    
    await result.current.pasteToSelectedCells()
    
    // 縦一列のデータが3列にわたって繰り返しペーストされる
    // 1列目
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 0, 'X3')
    
    // 2列目
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 1, 'X3')
    
    // 3列目
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 2, 'X1')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 2, 'X2')
    expect(mockUpdateCell).toHaveBeenCalledWith(2, 2, 'X3')
  })

  it('pasteToSelectedCells: 選択範囲の開始位置からペーストされること', async () => {
    // クリップボードの内容をモック
    Object.defineProperty(navigator.clipboard, 'readText', {
      value: vi.fn().mockResolvedValue('test'),
      configurable: true
    })

    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: { start: { row: 1, col: 1 }, end: { row: 2, col: 2 } },
      currentCell: { row: 2, col: 2 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))

    await result.current.pasteToSelectedCells()

    // 選択範囲の開始位置（1,1）にペーストされることを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'test')
  })

  it('pasteToSelectedCells: 単一セルのコピーを複数選択したセルすべてにペーストできること', async () => {
    // 単一セルのコピー内容をモック
    Object.defineProperty(navigator.clipboard, 'readText', {
      value: vi.fn().mockResolvedValue('single'),
      configurable: true
    })

    const { result } = renderHook(() => useClipboard({
      tableData: mockTableData,
      selectedCells: { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } },
      currentCell: { row: 0, col: 0 },
      updateCell: mockUpdateCell,
      updateMultipleCells: mockUpdateMultipleCells
    }))

    await result.current.pasteToSelectedCells()

    // 選択した4つのセルすべてに同じ値がペーストされることを確認
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 0, 'single')
    expect(mockUpdateCell).toHaveBeenCalledWith(0, 1, 'single')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 0, 'single')
    expect(mockUpdateCell).toHaveBeenCalledWith(1, 1, 'single')
  })
}) 