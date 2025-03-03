import React from 'react'
import styles from './ShortcutHelp.module.css'

type ShortcutHelpProps = {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>ショートカットキー一覧</h2>
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
              <tr>
                <td>Ctrl+C / ⌘+C</td>
                <td>コピー</td>
              </tr>
              <tr>
                <td>Ctrl+X / ⌘+X</td>
                <td>切り取り</td>
              </tr>
              <tr>
                <td>Ctrl+V / ⌘+V</td>
                <td>貼り付け</td>
              </tr>
              <tr>
                <td>Ctrl+A / ⌘+A</td>
                <td>すべて選択</td>
              </tr>
              <tr>
                <td>Ctrl+Z / ⌘+Z</td>
                <td>元に戻す</td>
              </tr>
              <tr>
                <td>Ctrl+Y / ⌘+Y</td>
                <td>やり直し</td>
              </tr>
              <tr>
                <td>Delete / Backspace</td>
                <td>セルクリア</td>
              </tr>
              <tr>
                <td>F2 / Enter</td>
                <td>編集開始</td>
              </tr>
              <tr>
                <td>Escape</td>
                <td>編集キャンセル</td>
              </tr>
              <tr>
                <td>Enter (編集中)</td>
                <td>編集確定</td>
              </tr>
              <tr>
                <td>矢印キー</td>
                <td>セル移動</td>
              </tr>
              <tr>
                <td>Shift + 矢印キー</td>
                <td>選択範囲拡大</td>
              </tr>
              <tr>
                <td>Tab / Shift+Tab</td>
                <td>右/左に移動</td>
              </tr>
              <tr>
                <td>Shift+?</td>
                <td>このヘルプを表示</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 