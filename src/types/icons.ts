/**
 * アイコンの種類を定義する列挙型
 */
export enum IconType {
  COPY = 'copy',
  CUT = 'cut',
  PASTE = 'paste',
  MARKDOWN = 'markdown',
  SELECT_ALL = 'select-all',
  CLEAR_SELECTION = 'clear-selection',
  ADD_ROW = 'add-row',
  REMOVE_ROW = 'remove-row',
  ADD_COLUMN = 'add-column',
  REMOVE_COLUMN = 'remove-column',
  UNDO = 'undo',
  REDO = 'redo',
  UPDATE_WIDTH = 'update-width',
  SHORTCUT = 'shortcut'
}

/**
 * アイコンのパスを取得する関数
 * @param iconType アイコンの種類
 * @returns アイコンのパス
 */
export const getIconPath = (iconType: IconType): string => {
  return `/icons/${iconType}.svg`;
}; 