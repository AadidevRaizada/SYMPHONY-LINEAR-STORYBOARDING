import { useState } from 'react'
import logo from './Vibe-pr.png'
import codexLogo from '../images/codex-color.svg'

const installCommand = 'npx skills add inference-sh/skills@landing-page-design'

const proofItems = [
  ['Recorded run', 'Playwright captures the flow working after the agent ships.'],
  ['Visual summary', 'A short storyboard explains the before, change, and result.'],
  ['Code context attached', 'Root cause, files touched, and reviewer notes travel with the PR.'],
  ['Telegram alert', 'The user gets notified after context and proof are attached.'],
]

const steps = ['Issue', 'Agent', 'Verification', 'Reviewable PR', 'Telegram']

function App() {
  const [copied, setCopied] = useState(false)

  const copyInstallCommand = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main>
      <nav className="nav" aria-label="Primary">
        <a className="brand" href="/">
          <img className="brand-logo" src={logo} alt="Vibe-PR" />
          <span>Vibe-PR</span>
        </a>
        <div className="hackathon-badge" aria-label="For Codex Pune community hackathon">
          <img className="codex-logo" src={codexLogo} alt="" aria-hidden="true" />
          <span>For Codex Pune community hackathon</span>
        </div>
        <div className="nav-actions">
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            Docs
          </a>
          <a className="button button-small" href="#demo">
            See it live
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">The visual review layer for autonomous coding</p>
          <h1>The chillest way to review AI code.</h1>
          <p className="lede">
            Vibe-PR turns agent-made pull requests into evidence, narrative, and
            a clear review storyboard that anyone can open from anywhere.
          </p>
          <div className="hero-actions">
            <a className="button" href="#demo">
              Watch demo
            </a>
            <a className="text-link" href="#why">
              Why it matters
            </a>
          </div>
        </div>

        <div className="hero-media">
          <div className="install-command" aria-label="Install command">
            <span>$</span>
            <code>{installCommand}</code>
            <button type="button" onClick={copyInstallCommand}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <section className="hero-gif" aria-label="Product GIF placeholder">
            <div className="gif-frame">
              <span>Drop product GIF here</span>
            </div>
          </section>
        </div>
      </section>

      <section
        className="demo-video"
        id="demo"
        aria-label="Demo video"
      >
        <span>Demo video</span>
      </section>

      <section className="thesis" id="why">
        <p>
          The bottleneck is no longer code generation. It is trust, context, and
          review speed.
        </p>
      </section>

      <section className="flow" aria-label="Workflow">
        {steps.map((step, index) => (
          <div className="flow-step" key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="proof-grid" id="proof">
        <div className="section-heading">
          <p className="eyebrow">Demo surface</p>
          <h2>Implementation, proof, and explanation in one PR.</h2>
        </div>
        {proofItems.map(([title, body]) => (
          <article className="proof-card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="final">
        <p>"The next generation of agentic reviewing."</p>
        <a className="button" href="#demo">
          Open demo
        </a>
      </section>

      <footer className="footer">
        <span className="footer-copy">&copy; {new Date().getFullYear()} Vibe-PR</span>
        <div className="footer-socials">
          <a
            className="social-icon"
            href="https://linkedin.com/company/vibe-pr"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            className="social-icon"
            href="https://x.com/vibe_pr"
            target="_blank"
            rel="noreferrer"
            aria-label="X (Twitter)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App
