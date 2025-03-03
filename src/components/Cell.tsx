import { FC, KeyboardEvent, useState, useEffect, useRef } from 'react'
import styles from './Cell.module.css'

type CellProps = {
  value: string
  isEditing: boolean
  isSelected: boolean
  onEdit: (value: string) => void
  onSelect: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => void
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
  onDoubleClick?: () => void
  onMouseDown?: () => void
  onMouseMove?: () => void
  onMouseUp?: () => void
  onMouseEnter?: () => void
}

export const Cell: FC<CellProps> = ({
  value,
  isEditing,
  isSelected,
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

  // 編集モードが変わったとき、または値が変わったときに入力値を更新
  useEffect(() => {
    // 編集モードが開始されたとき、または編集モードでなく値が変わったときだけ入力値を更新
    if (!prevIsEditing && isEditing) {
      // 編集モードが開始された場合
      setInputValue(value || '')
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
      setHasUserEdited(false)
    }
    
    setPrevIsEditing(isEditing)
    setPrevValue(value)
  }, [isEditing, value, prevIsEditing, prevValue])

  // 入力値の変更を処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHasUserEdited(true)
    
    // IME入力中は親コンポーネントに通知しない
    if (!isComposingRef.current) {
      onEdit(newValue)
    }
  }

  // フォーカスが外れたときの処理
  const handleBlur = () => {
    // 編集中の場合のみ処理
    if (isEditing && hasUserEdited) {
      onEdit(inputValue)
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
  const handleMouseDown = (e: React.MouseEvent) => {
    // 左クリックのみ処理
    if (e.button === 0 && onMouseDown) {
      onMouseDown()
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
    if (hasUserEdited) {
      onEdit(inputValue)
    }
  }

  // キーダウン時の処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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