import { useEffect, useRef } from 'react'
import { TableData } from '../types/table'

type KeyboardEventHandlers = {
  moveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void
  setShiftKey: (pressed: boolean) => void
  copySelectedCells: () => void
  cutSelectedCells?: () => void
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
  const pendingKeyRef = useRef<string | null>(null)
  const isEditingRef = useRef(handlers.isEditing)
  const handlersRef = useRef(handlers)

  // handlersの値が変わったときにrefを更新
  useEffect(() => {
    handlersRef.current = handlers
    isEditingRef.current = handlers.isEditing
  }, [handlers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 最新のハンドラーを使用
      const currentHandlers = handlersRef.current

      // IME入力中はキーボードイベントを処理しない
      if (isComposingRef.current) return

      // Shiftキーの状態を追跡
      if (e.key === 'Shift') {
        currentHandlers.setShiftKey(true)
      }

      // 編集モード中の特別な処理
      if (isEditingRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          currentHandlers.stopEditing(false)
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          currentHandlers.stopEditing(true)
          // Enterキーを押したら下のセルに移動
          currentHandlers.moveSelection('down')
        } else if (e.key === 'Tab') {
          e.preventDefault()
          currentHandlers.stopEditing(true)
          // Tabキーを押したら右のセルに移動（Shift+Tabなら左に移動）
          if (e.shiftKey) {
            currentHandlers.moveSelection('left')
          } else {
            currentHandlers.moveSelection('right')
          }
        }
        return
      }

      // 通常モードでのキーボード操作
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          currentHandlers.moveSelection('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          currentHandlers.moveSelection('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          currentHandlers.moveSelection('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          currentHandlers.moveSelection('right')
          break
        case 'Enter':
        case 'F2':
          e.preventDefault()
          currentHandlers.startEditing()
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          currentHandlers.clearSelectedCells()
          break
        case 'Tab':
          e.preventDefault()
          if (e.shiftKey) {
            currentHandlers.moveSelection('left')
          } else {
            currentHandlers.moveSelection('right')
          }
          break
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            currentHandlers.copySelectedCells()
          } else {
            // 直接入力の場合
            e.preventDefault() // テスト用にpreventDefaultを呼び出す
            pendingKeyRef.current = e.key
            currentHandlers.startEditing()
          }
          break
        case 'x':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            // カット機能が提供されている場合はそれを使用
            if (currentHandlers.cutSelectedCells) {
              currentHandlers.cutSelectedCells()
            }
          } else {
            // 直接入力の場合
            e.preventDefault() // テスト用にpreventDefaultを呼び出す
            pendingKeyRef.current = e.key
            currentHandlers.startEditing()
          }
          break
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            currentHandlers.pasteToSelectedCells()
          } else {
            // 直接入力の場合
            e.preventDefault() // テスト用にpreventDefaultを呼び出す
            pendingKeyRef.current = e.key
            currentHandlers.startEditing()
          }
          break
        // 文字入力を開始した場合（通常の文字キー）
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // テスト用にpreventDefaultを呼び出す
            e.preventDefault()
            // 入力された文字を保存
            pendingKeyRef.current = e.key
            currentHandlers.startEditing()
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        handlersRef.current.setShiftKey(false)
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
  }, []) // 依存配列を空にして、ハンドラーの参照はrefで管理

  return {
    getPendingKey: () => {
      const key = pendingKeyRef.current
      pendingKeyRef.current = null
      return key
    },
    updateHandlers: (newHandlers: Partial<KeyboardEventHandlers>) => {
      handlersRef.current = { ...handlersRef.current, ...newHandlers }
      isEditingRef.current = handlersRef.current.isEditing
    }
  }
} 