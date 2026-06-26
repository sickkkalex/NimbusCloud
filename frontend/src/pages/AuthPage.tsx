import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, KeyRound } from 'lucide-react'
import { login as apiLogin, register as apiRegister, forgotPassword, verifyOtp, resetPassword } from '../api/auth'
import { getProfile } from '../api/user'
import { useAuthStore } from '../store/authStore'

type Tab = 'login' | 'register'
type ForgotStep = 'email' | 'otp' | 'password'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login: storeLogin } = useAuthStore()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const decodeUserFromToken = (token: string, fallbackEmail: string) => {
    const parts = token.split('.')
    let user = { id: '', email: fallbackEmail }
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]))
        user = { id: payload.id ?? '', email: payload.email ?? fallbackEmail }
      } catch { /* use defaults */ }
    }
    return user
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        const data = await apiLogin({ email, password })
        const baseUser = decodeUserFromToken(data.token, email)
        try {
          storeLogin(data.token, baseUser)
          const profile = await getProfile()
          storeLogin(data.token, profile)
        } catch {
          storeLogin(data.token, baseUser)
        }
        navigate('/')
      } else {
        const data = await apiRegister({ email, password })
        setSuccess(data.message + ' Ora puoi effettuare il login.')
        setTab('login')
        setPassword('')
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore sconosciuto')
          : 'Errore sconosciuto'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await forgotPassword(forgotEmail)
      setSuccess(data.message)
      setForgotStep('otp')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore sconosciuto')
          : 'Errore sconosciuto'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await verifyOtp(forgotEmail, otp)
      setResetToken(data.resetToken)
      setForgotStep('password')
      setSuccess('Codice verificato. Imposta la nuova password.')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore sconosciuto')
          : 'Errore sconosciuto'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await resetPassword({ email: forgotEmail, otp, resetToken, newPassword })
      setSuccess('Password aggiornata! Ora puoi accedere.')
      setForgotOpen(false)
      setForgotStep('email')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setEmail(forgotEmail)
      setTab('login')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Errore sconosciuto')
          : 'Errore sconosciuto'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const closeForgot = () => {
    setForgotOpen(false)
    setForgotStep('email')
    setError(null)
    setSuccess(null)
  }

  const features = [
    { icon: '🔐', title: 'Sicuro', desc: 'Ogni file protetto con JWT e crittografia' },
    { icon: '⚡', title: 'Veloce', desc: 'Upload e accesso in tempo reale' },
    { icon: '🔗', title: 'Condivisibile', desc: 'Link di condivisione con scadenza' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-nimbus-600 via-nimbus-500 to-nimbus-400 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-nimbus-300/30 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          <img src="/logo.png" alt="NimbusCloud Logo" className="w-10 h-10 object-contain drop-shadow-md brightness-0 invert" />
          <span className="text-2xl font-bold text-white">NimbusCloud</span>
        </motion.div>

        <div className="relative z-10">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-8"
          >
            <img src="/logo.png" alt="NimbusCloud Logo" className="w-28 h-28 object-contain drop-shadow-2xl mx-auto brightness-0 invert" />
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Il tuo cloud<br />
            <span className="text-nimbus-100">personale.</span>
          </h1>
          <p className="text-nimbus-100 text-lg leading-relaxed mb-10">
            Carica, gestisci e condividi i tuoi file in modo sicuro, senza limiti di terze parti.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15"
              >
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-nimbus-100 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 text-nimbus-200 text-sm"
        >
          © 2025 NimbusCloud. Tutti i diritti riservati.
        </motion.p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="NimbusCloud Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
          <span className="text-xl font-bold">Nimbus<span className="text-gradient">Cloud</span></span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <AnimatePresence mode="wait">
            {forgotOpen ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button onClick={closeForgot} className="flex items-center gap-1 text-sm text-gray-500 hover:text-nimbus-600 mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Torna al login
                </button>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">Recupera password</h2>
                <p className="text-gray-500 mb-8">
                  {forgotStep === 'email' && 'Inserisci la tua email per ricevere un codice OTP'}
                  {forgotStep === 'otp' && 'Inserisci il codice a 6 cifre ricevuto via email'}
                  {forgotStep === 'password' && 'Scegli una nuova password sicura'}
                </p>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
                )}
                {success && (
                  <div className="mb-4 px-4 py-3 bg-nimbus-50 border border-nimbus-200 text-nimbus-700 text-sm rounded-xl">{success}</div>
                )}

                {forgotStep === 'email' && (
                  <form onSubmit={handleForgotEmail} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="la@tua.email"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Invia codice OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {forgotStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Codice OTP</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="input-field pl-11 tracking-[0.3em] text-center font-mono text-lg"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verifica codice <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {forgotStep === 'password' && (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nuova password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Conferma password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Aggiorna password <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-8"
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {tab === 'login' ? 'Bentornato 👋' : 'Crea account'}
                  </h2>
                  <p className="text-gray-500">
                    {tab === 'login'
                      ? 'Accedi al tuo cloud personale'
                      : 'Registrati gratuitamente e inizia subito'}
                  </p>
                </motion.div>

                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8">
                  {(['login', 'register'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      id={`tab-${t}`}
                      onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                      className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200
                        ${tab === t ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab === t && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {t === 'login' ? 'Accedi' : 'Registrati'}
                      </span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="mb-4 px-4 py-3 bg-nimbus-50 border border-nimbus-200 text-nimbus-700 text-sm rounded-xl"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={tab}
                    initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tab === 'login' ? 20 : -20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div>
                      <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          id="email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="la@tua.email"
                          className="input-field pl-11"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">Password</label>
                        {tab === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setForgotOpen(true); setForgotEmail(email); setError(null); setSuccess(null) }}
                            className="text-xs text-nimbus-600 hover:text-nimbus-700 font-medium"
                          >
                            Password dimenticata?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="input-field pl-11 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      id="auth-submit-btn"
                      type="submit"
                      disabled={loading}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary w-full animate-pulse-green"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>{tab === 'login' ? 'Accedi' : 'Crea account'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                </AnimatePresence>

                <p className="text-center text-sm text-gray-500 mt-6">
                  {tab === 'login' ? (
                    <>Non hai un account?{' '}
                      <button onClick={() => setTab('register')} className="text-nimbus-600 font-semibold hover:text-nimbus-700">
                        Registrati
                      </button>
                    </>
                  ) : (
                    <>Hai già un account?{' '}
                      <button onClick={() => setTab('login')} className="text-nimbus-600 font-semibold hover:text-nimbus-700">
                        Accedi
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
