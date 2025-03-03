import { useEffect, useRef } from 'react'
import { TableData } from '../types/table'

type KeyboardEventHandlers = {
  moveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void
  setShiftKey: (pressed: boolean) => void
  copySelectedCells: () => void
  pasteToSelectedCells: () => void
  startEditing: () => void
  stopEditing: (save?: boolean) => void
  clearSelectedCells: () => void
  isEditing: boolean
}

/**
 * キーボードイベントを管理するカスタムフック
 * @param handlers イベントハンドラー
 */
export const useKeyboardEvents = (
  data: TableData,
  handlers: KeyboardEventHandlers
) => {
  const isComposingRef = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // IME入力中はキーボードイベントを処理しない
      if (isComposingRef.current) return

      // Shiftキーの状態を追跡
      if (e.key === 'Shift') {
        handlers.setShiftKey(true)
      }

      // 編集モード中の特別な処理
      if (handlers.isEditing) {
        if (e.key === 'Escape') {
          e.preventDefault()
          handlers.stopEditing(false)
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handlers.stopEditing(true)
          // Enterキーを押したら下のセルに移動
          handlers.moveSelection('down')
        } else if (e.key === 'Tab') {
          e.preventDefault()
          handlers.stopEditing(true)
          // Tabキーを押したら右のセルに移動（Shift+Tabなら左に移動）
          if (e.shiftKey) {
            handlers.moveSelection('left')
          } else {
            handlers.moveSelection('right')
          }
        }
        return
      }

      // 通常モードでのキーボード操作
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          handlers.moveSelection('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handlers.moveSelection('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.moveSelection('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.moveSelection('right')
          break
        case 'Enter':
        case 'F2':
          e.preventDefault()
          handlers.startEditing()
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          handlers.clearSelectedCells()
          break
        case 'Tab':
          e.preventDefault()
          if (e.shiftKey) {
            handlers.moveSelection('left')
          } else {
            handlers.moveSelection('right')
          }
          break
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handlers.copySelectedCells()
          }
          break
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handlers.pasteToSelectedCells()
          }
          break
        // 文字入力を開始した場合（通常の文字キー）
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            handlers.startEditing()
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        handlers.setShiftKey(false)
      }
    }

    const handleCompositionStart = () => {
      isComposingRef.current = true
    }

    const handleCompositionEnd = () => {
      isComposingRef.current = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('compositionstart', handleCompositionStart)
    document.addEventListener('compositionend', handleCompositionEnd)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('compositionstart', handleCompositionStart)
      document.removeEventListener('compositionend', handleCompositionEnd)
    }
  }, [data, handlers])
} 