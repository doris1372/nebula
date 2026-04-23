import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useStore } from './store'

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = useStore((s) => s.login)
  const signup = useStore((s) => s.signup)
  const authError = useStore((s) => s.authError)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'login') await login({ email, password })
      else await signup({ email, password, name: name || email.split('@')[0], handle: handle || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '') })
    } catch {
      /* store sets error */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-ink-950 p-6 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-24 w-[520px] h-[520px] rounded-full bg-accent-500/20 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-mint-400/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Nebula</div>
            <div className="text-xs text-ink-300">chat like it's stardust</div>
          </div>
        </div>

        <div className="rounded-2xl bg-ink-900/80 backdrop-blur border border-ink-700 p-6 shadow-2xl">
          <div className="flex bg-ink-800 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'login' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow' : 'text-ink-200 hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow' : 'text-ink-200 hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <Field label="Display name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aurora"
                    className="input"
                  />
                </Field>
                <Field label="Handle" hint="lowercase, no spaces">
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="aurora"
                    className="input"
                  />
                </Field>
              </>
            )}
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nebula.chat"
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </Field>

            {authError && (
              <div className="px-3 py-2 rounded-lg bg-rose-400/10 border border-rose-400/40 text-rose-400 text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition disabled:opacity-50"
            >
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-ink-300">
            {mode === 'login' ? (
              <>New here? <button className="text-brand-400 font-medium" onClick={() => setMode('signup')}>Create an account</button></>
            ) : (
              <>Already have one? <button className="text-brand-400 font-medium" onClick={() => setMode('login')}>Sign in</button></>
            )}
          </div>
        </div>

        <style>{`
          .input {
            width: 100%;
            background: var(--color-ink-800);
            border: 1px solid var(--color-ink-700);
            color: white;
            padding: 10px 12px;
            border-radius: 10px;
            font-size: 14px;
            outline: none;
          }
          .input:focus {
            border-color: var(--color-brand-500);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
          }
          .input::placeholder { color: var(--color-ink-300); }
        `}</style>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">{label}</span>
        {hint && <span className="text-[10px] text-ink-400">{hint}</span>}
      </div>
      {children}
    </label>
  )
}
