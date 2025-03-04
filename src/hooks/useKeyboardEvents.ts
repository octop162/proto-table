import { useEffect, useRef, useCallback } from 'react'
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
  showShortcutHelp?: () => void  // ショートカットヘルプ表示用
  undo?: () => void  // 元に戻す
  redo?: () => void  // やり直し
  selectAllCells?: () => void  // すべてのセルを選択
  clearSelection?: () => void  // 選択を解除
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

  // ハンドラーを更新する関数
  const updateHandlers = useCallback((newHandlers: Partial<KeyboardEventHandlers>) => {
    handlersRef.current = { ...handlersRef.current, ...newHandlers }
    isEditingRef.current = newHandlers.isEditing ?? isEditingRef.current
  }, [])

  // 保留中のキーを取得
  const getPendingKey = useCallback(() => {
    const key = pendingKeyRef.current
    pendingKeyRef.current = null
    return key
  }, [])

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
        // Escキーで編集キャンセル
        if (e.key === 'Escape') {
          e.preventDefault()
          currentHandlers.stopEditing(false)
          return
        }

        // Alt+Enterは編集モードのままセル内で改行を挿入するため、ここでは何もしない
        if (e.key === 'Enter' && e.altKey) {
          return
        }

        // Enterキーで編集確定
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          currentHandlers.stopEditing(true)
          // Enterキーを押したら下のセルに移動
          currentHandlers.moveSelection('down')
          return
        }

        // Tabキーで編集確定して移動
        if (e.key === 'Tab') {
          e.preventDefault()
          currentHandlers.stopEditing(true)
          // Tabキーを押したら右のセルに移動（Shift+Tabなら左に移動）
          if (e.shiftKey) {
            currentHandlers.moveSelection('left')
          } else {
            currentHandlers.moveSelection('right')
          }
          return
        }

        // 編集モード中は他のキーボードショートカットを処理しない
        return
      }

      // 以下、編集モードでない場合の処理

      // Escキーで選択解除
      if (e.key === 'Escape') {
        e.preventDefault()
        if (currentHandlers.clearSelection) {
          currentHandlers.clearSelection()
        }
        return
      }

      // Ctrl+A または Cmd+A ですべて選択
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        if (currentHandlers.selectAllCells) {
          currentHandlers.selectAllCells()
        }
        return
      }

      // 矢印キーでセル移動
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
        currentHandlers.moveSelection(direction)
        return
      }

      // Tabキーで右/左に移動
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          currentHandlers.moveSelection('left')
        } else {
          currentHandlers.moveSelection('right')
        }
        return
      }

      // DeleteまたはBackspaceキーでセルクリア
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        currentHandlers.clearSelectedCells()
        return
      }

      // Ctrl+C または Cmd+C でコピー
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        currentHandlers.copySelectedCells()
        return
      }

      // Ctrl+X または Cmd+X でカット
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        if (currentHandlers.cutSelectedCells) {
          currentHandlers.cutSelectedCells()
        }
        return
      }

      // Ctrl+V または Cmd+V でペースト
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        currentHandlers.pasteToSelectedCells()
        return
      }

      // Ctrl+Z または Cmd+Z で元に戻す
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (currentHandlers.undo) {
          currentHandlers.undo()
        }
        return
      }

      // Ctrl+Y または Cmd+Y でやり直し
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        if (currentHandlers.redo) {
          currentHandlers.redo()
        }
        return
      }

      // Shift+? でショートカットヘルプ表示
      if (e.shiftKey && e.key === '?') {
        e.preventDefault()
        if (currentHandlers.showShortcutHelp) {
          currentHandlers.showShortcutHelp()
        }
        return
      }

      // 通常の文字キーによる編集開始機能は削除
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Shiftキーの状態を追跡
      if (e.key === 'Shift') {
        handlersRef.current.setShiftKey(false)
      }
    }

    // IME入力の開始と終了を検知
    const handleCompositionStart = () => {
      isComposingRef.current = true
    }

    const handleCompositionEnd = () => {
      isComposingRef.current = false
    }

    // イベントリスナーを登録
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('compositionstart', handleCompositionStart)
    document.addEventListener('compositionend', handleCompositionEnd)

    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('compositionstart', handleCompositionStart)
      document.removeEventListener('compositionend', handleCompositionEnd)
    }
  }, [data])

  return {
    getPendingKey,
    updateHandlers
  }
} 