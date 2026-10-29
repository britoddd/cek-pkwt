import { useEffect, useRef, useState } from 'react'
import logo from '../../assets/logos/cekpkwt-logo-full-horizontal.svg'
import logoReversed from '../../assets/logos/cekpkwt-logo-full-horizontal-reversed.svg'
import type { CheckResult, HrDraft } from './api'
import { Icon } from './components'
import Ask from './pages/Ask'
import Check from './pages/Check'
import Home from './pages/Home'
import HrEmail from './pages/HrEmail'
import Report from './pages/Report'

// Hash routes ("#/cek") keep the build a static bundle; plain anchors ("#cara-kerja") stay on the home page.
const currentRoute = () => (location.hash.startsWith('#/') ? location.hash.slice(1) : '/')

export default function App() {
  const [route, setRoute] = useState(currentRoute)
  // The report lives only in memory: contracts are never stored, so a reload clears it.
  const [result, setResult] = useState<CheckResult | null>(null)
  const [draft, setDraft] = useState<HrDraft | null>(null)
  const shownRoute = useRef(route)

  useEffect(() => {
    const onHash = () => setRoute(currentRoute())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  // On navigation, start at the top and focus the new page's heading so screen readers announce it.
  useEffect(() => {
    if (shownRoute.current === route) return
    shownRoute.current = route
    scrollTo(0, 0)
    document.querySelector<HTMLElement>('main h1')?.focus()
  }, [route])

  const onChecked = (r: CheckResult) => {
    setResult(r)
    setDraft(null)
    location.hash = '#/laporan'
  }

  let page
  switch (route) {
    case '/cek': page = <Check onChecked={onChecked} />; break
    case '/laporan': page = <Report result={result} />; break
    case '/email-hr': page = <HrEmail result={result} draft={draft} onDraft={setDraft} />; break
    case '/tanya': page = <Ask />; break
    default: page = <Home />
  }

  return (
    <>
      <Header route={route} hasReport={result !== null} />
      <main>{page}</main>
      <Footer home={route === '/'} />
    </>
  )
}

function Header({ route, hasReport }: { route: string; hasReport: boolean }) {
  const home = route === '/'
  const link = (path: string, label: string) => (
    <a href={`#${path}`} aria-current={route === path ? 'page' : undefined}>{label}</a>
  )
  return (
    <header className="site-header">
      <div className="container">
        <a href="#/" className="brand" aria-label="CekPKWT, beranda">
          <img src={logo} alt="" width={139} height={32} />
        </a>
        <nav className="nav" aria-label="Utama">
          {home && <><a href="#cara-kerja">Cara kerja</a><a href="#prinsip">Prinsip</a><a href="#batasan">Batasan</a></>}
          {!home && link('/cek', 'Cek kontrak')}
          {link('/tanya', 'Tanya aturan')}
          {hasReport && link('/laporan', 'Laporan')}
          {home && <a href="#/cek" className="btn btn-primary btn-sm">Cek kontrak</a>}
        </nav>
      </div>
    </header>
  )
}

function Footer({ home }: { home: boolean }) {
  return (
    <footer>
      {home && (
        <div className="footer-cta">
          <div className="container">
            <h2>Kontrak kerja pertama? Cek dulu, baru tanda tangan.</h2>
            <a href="#/cek" className="btn btn-highlight btn-lg">Tempel kontrakmu<Icon name="arrowRight" /></a>
          </div>
        </div>
      )}
      <div className="footer-base">
        <div className="container">
          <img src={logoReversed} alt="CekPKWT" width={139} height={32} />
          <p>
            <strong>Ini bukan nasihat hukum.</strong> Hasil CekPKWT dibuat oleh AI dari basis regulasi yang terbatas
            dan bisa keliru. Untuk masalah serius, hubungi LBH (Lembaga Bantuan Hukum) atau Dinas Tenaga Kerja setempat.
          </p>
          <p>Dibangun dengan IBM Bob dan IBM Langflow · Education &amp; Future of Work</p>
        </div>
      </div>
    </footer>
  )
}
