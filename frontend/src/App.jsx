import './App.css'
import AppRoutes from './AppRoutes.jsx'
import SiteLayout from './components/SiteLayout.jsx'

function App() {
  return (
    <SiteLayout>
      <div className="appShell">
        <AppRoutes />
      </div>
    </SiteLayout>
  )
}

export default App
