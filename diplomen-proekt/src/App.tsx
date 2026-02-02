import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { usePresenceHeartbeat } from './hooks/usePresenceHeartbeat'
import { Home } from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import { LandingPage } from './pages/LandingPage'
import { Profile } from './pages/Profile'
import { FindTeacher } from './pages/FindTeacher'
import { TeacherProfile } from './pages/TeacherProfile'
import { Chat } from './pages/Chat'
import { Navbar } from './components/Navbar'


function App() {
  const { user } = useAuth()
  usePresenceHeartbeat(user?.id ?? null)

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/*"
        element={
          <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
              <Routes>
                <Route path="home" element={<Home />} />
                <Route path="profile" element={<Profile />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="login" element={<Login />} />
                <Route path="find-teacher" element={<FindTeacher />} />
                <Route path="teacher/:id" element={<TeacherProfile />} />
                <Route path="chat" element={<Chat />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  )
}

export default App
