import { Dashboard } from './components/Dashboard'
import { AppProviders } from './providers/AppProviders'

function App() {
  return (
    <AppProviders>
      <Dashboard />
    </AppProviders>
  )
}

export default App
