import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Navbar } from './components/Navbar'
import SignUp from './pages/SignUp'


function App() { 
  return (
    <div >
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
