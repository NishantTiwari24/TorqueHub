import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/common/feedback/ToastContainer'

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer />
      <AppRoutes />
    </div>
  )
}

export default App
