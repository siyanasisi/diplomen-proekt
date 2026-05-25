import { Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { GuestOnlyRoute, ProtectedRoute } from './components/auth/AuthRouteBoundary'
import { StudyPlanIntro } from './components/StudyPlanIntro'
import { StudyPlanQuestionnaire } from './components/StudyPlanQuestionnaire'
import { usePresenceHeartbeat } from './hooks/usePresenceHeartbeat'
import { Chat } from './pages/Chat'
import { FindTeacher } from './pages/FindTeacher'
import { Home } from './pages/Home'
import { LandingPage } from './pages/LandingPage'
import { Learning } from './pages/Learning'
import Login from './pages/Login'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import SignUp from './pages/SignUp'
import { StudyEntry } from './pages/StudyEntry'
import { TeacherProfile } from './pages/TeacherProfile'
import { TopicTest } from './pages/TopicTest'

function AppShell() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  const { user } = useAuth()
  usePresenceHeartbeat(user?.id ?? null)

  return (
    <Routes>
      <Route element={<GuestOnlyRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/study" element={<StudyEntry />} />
          <Route path="/study/learn/:subjectId/:topicId" element={<Learning />} />
          <Route path="/study/test/:topicId" element={<TopicTest />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/study-plan/intro" element={<StudyPlanIntro />} />
          <Route path="/study-plan/questionnaire" element={<StudyPlanQuestionnaire />} />
          <Route path="/find-teacher" element={<FindTeacher />} />
          <Route path="/teacher/:id" element={<TeacherProfile />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
