import { FC } from 'react'
import styles from './ShortcutHelp.module.css'

type ShortcutHelpProps = {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutHelp: FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const shortcuts = [
    { key: 'Ctrl+C / ⌘+C', description: 'コピー' },
    { key: 'Ctrl+X / ⌘+X', description: 'カット' },
    { key: 'Ctrl+V / ⌘+V', description: 'ペースト' },
    { key: 'Delete / Backspace', description: 'セルをクリア' },
    { key: 'F2 / Enter', description: '編集モード開始' },
    { key: 'Escape', description: '編集キャンセル' },
    { key: 'Enter', description: '編集確定（編集モード中）' },
    { key: '↑↓←→', description: 'セル移動' },
    { key: 'Shift+↑↓←→', description: '選択範囲を拡大' },
    { key: 'Tab / Shift+Tab', description: '右/左のセルに移動' },
    { key: 'Shift+?', description: 'このヘルプを表示' }
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>キーボードショートカット</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          <table className={styles.shortcutTable}>
            <thead>
              <tr>
                <th>ショートカット</th>
                <th>機能</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index}>
                  <td className={styles.keyCell}>{shortcut.key}</td>
                  <td>{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 