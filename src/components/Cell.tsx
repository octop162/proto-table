import { FC, KeyboardEvent, useState, useEffect, useRef, CSSProperties, MouseEvent } from 'react'
import styles from './Cell.module.css'

type CellProps = {
  value: string
  isEditing: boolean
  isSelected: boolean
  width?: number
  onEdit: (value: string) => void
  onSelect: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => void
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
  onDoubleClick?: () => void
  onMouseDown?: (e: MouseEvent<HTMLDivElement>) => void
  onMouseMove?: () => void
  onMouseUp?: () => void
  onMouseEnter?: () => void
}

export const Cell: FC<CellProps> = ({
  value,
  isEditing,
  isSelected,
  width,
  onEdit,
  onSelect,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  onDoubleClick,
  onMouseDown,
  onMouseMove,
  onMouseEnter,
  onMouseUp
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value || '')
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing)
  const [prevValue, setPrevValue] = useState(value)
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const isComposingRef = useRef(false)
  const inputValueRef = useRef(value || '')  // 入力値を参照するためのref
  const lastNotifiedValueRef = useRef(value || '')  // 最後に通知した値を記録するref

  // セルのスタイルを計算
  const cellStyle: CSSProperties = {
    width: width ? `${width}px` : undefined,
    minWidth: width ? `${width}px` : '80px',
    maxWidth: width ? `${width}px` : undefined,
  }

  // 編集モードが変わったとき、または値が変わったときに入力値を更新
  useEffect(() => {
    // 編集モードが開始されたとき、または編集モードでなく値が変わったときだけ入力値を更新
    if (!prevIsEditing && isEditing) {
      // 編集モードが開始された場合
      setInputValue(value || '')
      inputValueRef.current = value || ''
      lastNotifiedValueRef.current = value || ''
      setHasUserEdited(false)
      
      // フォーカスを当てて、テキストを全選択
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 0)
    } else if (!isEditing && prevValue !== value) {
      // 編集モードでなく、propsの値が変わった場合
      setInputValue(value || '')
      inputValueRef.current = value || ''
      lastNotifiedValueRef.current = value || ''
      setHasUserEdited(false)
    }
    
    setPrevIsEditing(isEditing)
    setPrevValue(value)
  }, [isEditing, value, prevIsEditing, prevValue])

  // 編集モードが終了するときに値を確実に親に通知
  useEffect(() => {
    if (prevIsEditing && !isEditing && hasUserEdited) {
      // 編集モードが終了した場合、変更があれば親に通知
      if (inputValueRef.current !== lastNotifiedValueRef.current) {
        onEdit(inputValueRef.current)
        lastNotifiedValueRef.current = inputValueRef.current
      }
    }
  }, [isEditing, prevIsEditing, hasUserEdited, onEdit])

  // 入力値の変更を処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    inputValueRef.current = newValue
    setHasUserEdited(true)
    
    // IME入力中は親コンポーネントに通知しない
    if (!isComposingRef.current) {
      onEdit(newValue)
      lastNotifiedValueRef.current = newValue
    }
  }

  // フォーカスが外れたときの処理
  const handleBlur = () => {
    // 編集中の場合のみ処理
    if (isEditing && hasUserEdited) {
      // 確実に最新の値を親に通知
      if (inputValueRef.current !== lastNotifiedValueRef.current) {
        onEdit(inputValueRef.current)
        lastNotifiedValueRef.current = inputValueRef.current
      }
    }
  }

  // クリックイベントの処理
  const handleClick = () => {
    onSelect()
  }

  // ダブルクリック時の処理
  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick()
    }
  }

  // マウスダウン時の処理
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // 左クリックのみ処理
    if (e.button === 0 && onMouseDown) {
      onMouseDown(e)
    }
  }

  // マウスムーブ時の処理
  const handleMouseMove = () => {
    if (onMouseMove) {
      onMouseMove()
    }
  }

  // マウスエンター時の処理
  const handleMouseEnter = (e: React.MouseEvent) => {
    // マウスボタンが押されている場合のみ処理
    if (e.buttons === 1 && onMouseEnter) {
      onMouseEnter()
    }
  }

  // マウスアップ時の処理
  const handleMouseUp = () => {
    if (onMouseUp) {
      onMouseUp()
    }
  }

  // IME入力開始
  const handleCompositionStart = () => {
    isComposingRef.current = true
    if (onCompositionStart) {
      onCompositionStart()
    }
  }

  // IME入力終了
  const handleCompositionEnd = () => {
    isComposingRef.current = false
    if (onCompositionEnd) {
      onCompositionEnd()
    }
    
    // IME入力完了時に親コンポーネントに通知
    if (hasUserEdited && inputValueRef.current !== lastNotifiedValueRef.current) {
      onEdit(inputValueRef.current)
      lastNotifiedValueRef.current = inputValueRef.current
    }
  }

  // キーダウン時の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter または Tab キーが押された場合、現在の入力値を親コンポーネントに通知
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
      // 現在の入力値を確実に親コンポーネントに通知
      if (hasUserEdited && inputValueRef.current !== lastNotifiedValueRef.current) {
        onEdit(inputValueRef.current)
        lastNotifiedValueRef.current = inputValueRef.current
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e)
    }
  }

  return (
    <div
      className={`${styles.cell} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      style={cellStyle}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className={styles.cellInput}
          autoFocus
        />
      ) : (
        <div className={styles.cellContent}>
          {value?.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < value.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      )}
    </div>
  )
} 