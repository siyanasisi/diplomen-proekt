import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import { LandingPage } from './pages/LandingPage'
import { Navbar } from './components/Navbar'


function App() { 
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/*"
        element={
          <div>
    <Navbar />
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="login" element={<Login />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  )
}

export default App
