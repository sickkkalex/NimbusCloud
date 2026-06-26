import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Calendar, HardDrive, LogOut, Camera, Save, Loader2, Check,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import Footer from '../components/Footer'
import { useAuthStore, getDisplayName } from '../store/authStore'
import { getProfile, updateProfile, uploadAvatar, upgradePlan } from '../api/user'
import { formatFileSize } from '../api/files'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(0)

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((profile) => {
      updateUser(profile)
      setFirstName(profile.firstName ?? '')
      setLastName(profile.lastName ?? '')
      setDateOfBirth(profile.dateOfBirth ?? '')
    }).catch(() => { })
  }, [updateUser])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const profile = await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        dateOfBirth: dateOfBirth || null,
      })
      updateUser(profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Errore nel salvataggio del profilo.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const profile = await uploadAvatar(file)
      updateUser(profile)
      setAvatarKey((k) => k + 1)
    } catch {
      setError('Errore nel caricamento della foto profilo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpgrade = async () => {
    if (!coupon.trim()) return
    setUpgrading(true)
    setUpgradeError(null)
    try {
      const res = await upgradePlan(coupon.trim())
      updateUser(res.user)
      setShowUpgradeModal(false)
      setCoupon('')
    } catch (err: any) {
      setUpgradeError(err?.response?.data?.error || 'Codice coupon non valido.')
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fffe 50%,#f0fdf4 100%)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 md:pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Il mio <span className="text-gradient">Profilo</span>
          </h1>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="card p-5 sm:p-8 mb-6">
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="relative group">
                <UserAvatar key={avatarKey} size="lg" className="rounded-3xl" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100
                             flex items-center justify-center transition-opacity duration-200"
                >
                  {uploading
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Camera className="w-6 h-6 text-white" />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{getDisplayName(user)}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <span className="badge-green mt-2 inline-flex">Account attivo</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Il tuo nome"
                      className="input-field pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cognome</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Il tuo cognome"
                      className="input-field pl-11"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data di nascita</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="input-field pl-11"
                  />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <><Check className="w-4 h-4" /> Salvato</>
              ) : (
                <><Save className="w-4 h-4" /> Salva modifiche</>
              )}
            </button>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Piano e Storage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="w-9 h-9 bg-nimbus-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-[18px] h-[18px] text-nimbus-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.email ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl relative overflow-hidden">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${user?.plan === 'PREMIUM' ? 'bg-amber-100' : 'bg-gray-200'}`}>
                  <HardDrive className={`w-[18px] h-[18px] ${user?.plan === 'PREMIUM' ? 'text-amber-600' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 font-medium">Piano Attuale</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    {user?.plan === 'PREMIUM' ? 'Premium 👑 (50GB)' : 'Free (1GB)'}
                  </p>
                </div>
                {user?.plan !== 'PREMIUM' && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="absolute right-4 text-xs font-semibold text-nimbus-600 hover:text-nimbus-700 bg-nimbus-50 px-2 py-1 rounded-lg"
                  >
                    Passa a Premium
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6 border-red-100">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Sessione</h3>
            <p className="text-sm text-gray-500 mb-4">Il tuo token JWT è valido per 7 giorni dall'ultimo login.</p>
            <button onClick={handleLogout} className="btn-danger">
              <LogOut className="w-4 h-4" /> Disconnetti
            </button>
          </div>
        </motion.div>
      </main>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !upgrading && setShowUpgradeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 w-full max-w-md"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-500">
                <HardDrive className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Passa a Premium 👑</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Ottieni <b>50GB</b> di spazio cloud a soli 3.99€ al mese. Per un periodo limitato, puoi attivare il piano Premium gratuitamente utilizzando un coupon promozionale.
              </p>

              {upgradeError && (
                <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
                  {upgradeError}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Codice Coupon</label>
                <input
                  type="text"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Inserisci Codice"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-nimbus-500 focus:ring-4 focus:ring-nimbus-500/10 transition-all font-mono uppercase"
                  disabled={upgrading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  disabled={upgrading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || !coupon.trim()}
                  className="flex-[2] px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {upgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Riscatta e Attiva'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
