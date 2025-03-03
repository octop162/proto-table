export type CellValue = string
export type CellData = {
  value: CellValue
  isEditing: boolean
  isSelected?: boolean
}

export type TableData = CellData[][]

export type Position = {
  row: number
  col: number
}

export type Selection = {
  start: Position
  end: Position
} 