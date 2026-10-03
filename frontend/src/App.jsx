import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { api } from './services/api'

const packages = [
  ['Aarambh','Digital Foundation',499],
  ['Udaan','Creative + Content Skills',999],
  ['Pragati','Marketing + Client Skills',1999],
  ['Brahmastra','Advanced Digital Skills',3999],
  ['Shikhar','Leadership + Business',6999]
]

function Shell({ children, session }) {
  const navigate = useNavigate()
  async function logout() {
    if (supabase) await supabase.auth.signOut()
    navigate('/login')
  }
  return <div className="app-shell">
    <header className="nav">
      <Link className="brand" to="/">Skill<span>Link</span></Link>
      <nav>
        <Link to="/courses">Courses</Link>
        <Link to="/packages">Packages</Link>
        <Link to="/masterclasses">Masterclasses</Link>
        {session ? <Link to="/dashboard">Dashboard</Link> : <Link to="/login">Login</Link>}
      </nav>
      {session && <button className="ghost" onClick={logout}>Logout</button>}
    </header>
    <main>{children}</main>
    <footer>© {new Date().getFullYear()} SkillLink · Learn. Build. Grow.</footer>
  </div>
}

function Home() {
  return <section className="hero page">
    <div className="hero-copy">
      <span className="eyebrow">DIGITAL SKILLS • PRACTICAL LEARNING</span>
      <h1>Turn skills into <span>real opportunities.</span></h1>
      <p>Learn practical digital skills, build projects, and grow through structured learning experiences.</p>
      <div className="actions"><Link className="primary" to="/courses">Explore learning</Link><Link className="secondary" to="/signup">Create account</Link></div>
    </div>
    <div className="hero-card"><div className="orb">SL</div><h3>One platform. Real progress.</h3><p>Courses, workshops, masterclasses and learning progress in one place.</p></div>
  </section>
}

function Packages() {
  return <section className="page"><div className="section-head"><span className="eyebrow">LEARNING PACKAGES</span><h2>Choose your learning path</h2></div>
    <div className="grid">{packages.map(([name, sub, price]) => <article className="card" key={name}>
      <div className="icon">✦</div><h3>{name}</h3><p>{sub}</p><strong>₹{price.toLocaleString('en-IN')}</strong><Link className="secondary full" to="/login">View package</Link>
    </article>)}</div>
  </section>
}

function Courses() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api('/courses').then(x => setCourses(x.courses || [])).catch(e => setError(e.message)) }, [])
  return <section className="page"><div className="section-head"><span className="eyebrow">MARKETPLACE</span><h2>Practical courses</h2><p>Courses published through the platform approval workflow appear here.</p></div>
    {error && <div className="notice">{error}</div>}
    <div className="grid">{courses.length ? courses.map(c => <article className="card" key={c.id}><h3>{c.title}</h3><p>{c.description || 'Practical learning experience.'}</p><span className="pill">{c.status}</span></article>) :
      <article className="empty"><h3>No published courses yet</h3><p>Once an approved instructor publishes a course, it will appear here.</p></article>}</div>
  </section>
}

function Masterclasses() {
  return <section className="page"><div className="section-head"><span className="eyebrow">LIVE LEARNING</span><h2>Masterclasses & workshops</h2></div>
    <div className="grid"><article className="card"><div className="icon">◎</div><h3>Upcoming experiences</h3><p>Live and recorded masterclasses will be listed here with schedule, seats, registration and payment verification.</p><Link className="secondary full" to="/login">Sign in to continue</Link></article>
    <article className="card"><div className="icon">◈</div><h3>Workshop learning</h3><p>Registration, attendance, resources, recordings and certificates are handled through the platform.</p></article></div>
  </section>
}

function Auth({ mode }) {
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [name,setName]=useState(''), [busy,setBusy]=useState(false), [msg,setMsg]=useState('')
  const navigate=useNavigate()
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg('')
    try {
      if (!supabase) throw new Error('Supabase frontend configuration is missing.')
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:name } } })
        if (error) throw error
        setMsg('Account created. Check your email if email confirmation is enabled.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch(e) { setMsg(e.message) } finally { setBusy(false) }
  }
  return <section className="auth page"><form className="auth-card" onSubmit={submit}>
    <span className="eyebrow">{mode === 'signup' ? 'GET STARTED' : 'WELCOME BACK'}</span><h2>{mode==='signup'?'Create your account':'Sign in'}</h2>
    {mode==='signup' && <input required placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/>}
    <input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
    <input required minLength="8" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
    {msg && <div className="notice">{msg}</div>}
    <button className="primary full" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'}</button>
    <p>{mode==='signup'?<>Already registered? <Link to="/login">Sign in</Link></>:<>New here? <Link to="/signup">Create an account</Link></>}</p>
  </form></section>
}

function Dashboard({ session }) {
  const [profile,setProfile]=useState(null), [error,setError]=useState('')
  useEffect(()=>{ if(session) api('/me').then(setProfile).catch(e=>setError(e.message)) },[session])
  if(!session) return <Navigate to="/login" replace/>
  return <section className="page"><div className="section-head"><span className="eyebrow">YOUR SPACE</span><h2>Dashboard</h2></div>
    {error && <div className="notice">{error}</div>}
    <div className="dashboard-grid">
      <article className="card"><span className="muted">Account</span><h3>{profile?.profile?.full_name || 'Member'}</h3><p>Role: {profile?.profile?.role || 'Loading…'}</p></article>
      <article className="card"><span className="muted">Learning</span><h3>My Learning</h3><p>Enrollments and progress will appear here after verified purchases.</p></article>
      <article className="card"><span className="muted">Security</span><h3>Protected session</h3><p>Role and permissions are determined server-side.</p></article>
    </div>
  </section>
}

export default function App(){
  const [session,setSession]=useState(null)
  useEffect(()=>{
    if(!supabase) return
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s))
    return ()=>subscription.unsubscribe()
  },[])
  return <Shell session={session}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/courses" element={<Courses/>}/><Route path="/packages" element={<Packages/>}/>
    <Route path="/masterclasses" element={<Masterclasses/>}/><Route path="/login" element={<Auth mode="login"/>}/><Route path="/signup" element={<Auth mode="signup"/>}/>
    <Route path="/dashboard" element={<Dashboard session={session}/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Shell>
}
