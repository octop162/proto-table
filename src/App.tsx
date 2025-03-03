import { Table } from './components/Table'
import { TableData } from './types/table'

const initialData: TableData = Array(10).fill(null).map(() =>
  Array(10).fill(null).map(() => ({
    value: '',
    isEditing: false,
  }))
)

function App() {
  return (
    <div className="app">
      <Table initialData={initialData} />
    </div>
  )
}

export default App
