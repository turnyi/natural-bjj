import { HashRouter, Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Admin } from './pages/Admin'
import { Athlete } from './pages/Athlete'
import { Championship } from './pages/Championship'
import { Championships } from './pages/Championships'
import { Join } from './pages/Join'
import { Team } from './pages/Team'
import { StoreProvider } from './store'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <main className="page">
          <Routes>
            <Route path="/" element={<Team />} />
            <Route path="/athletes/:id" element={<Athlete />} />
            <Route path="/championships" element={<Championships />} />
            <Route path="/championships/:id" element={<Championship />} />
            <Route path="/join" element={<Join />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Nav />
      </HashRouter>
    </StoreProvider>
  )
}
