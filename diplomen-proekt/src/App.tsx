import { Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import { LandingPage } from './pages/LandingPage'
import { Profile } from './pages/Profile'
import { StudyPlanIntro } from './components/StudyPlanIntro'
import { StudyPlanQuestionnaire } from './components/StudyPlanQuestionnaire'
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
              <Route path="profile" element={<Profile />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="login" element={<Login />} />
              <Route path="study-plan/intro" element={<StudyPlanIntro />} />
              <Route path="study-plan/questionnaire" element={<StudyPlanQuestionnaire />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  )
}

export default App
