import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, ChevronLeft, User } from 'lucide-react'
import { getMessages, sendMessage, getConversations, getUserMessages, type ChatMessage, type Conversation } from '../api/chat'
import { useAuthStore } from '../store/authStore'

const DEVELOPER_EMAIL = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_DEVELOPER_EMAIL

export default function DeveloperChat() {
  const { user } = useAuthStore()
  const isDev = Boolean(DEVELOPER_EMAIL && user?.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase())

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    setLoading(true)
    try {
      if (isDev && selectedUserId) {
        setMessages(await getUserMessages(selectedUserId))
      } else if (!isDev) {
        setMessages(await getMessages())
      }
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    if (!isDev) return
    try {
      setConversations(await getConversations())
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!open) return
    if (isDev && !selectedUserId) {
      loadConversations()
      const interval = setInterval(loadConversations, 8000)
      return () => clearInterval(interval)
    }
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [open, isDev, selectedUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const msg = await sendMessage(input.trim(), isDev ? selectedUserId ?? undefined : undefined)
      setInput('')
      if (isDev && selectedUserId) {
        setMessages((prev) => [...prev, msg])
      } else {
        setMessages((prev) => [...prev, msg])
      }
    } finally {
      setSending(false)
    }
  }

  const showChat = !isDev || selectedUserId

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5
                   bg-gradient-to-r from-nimbus-600 to-nimbus-500 text-white font-semibold
                   rounded-2xl shadow-[0_8px_32px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]
                   transition-shadow duration-300"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Supporto</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 z-50
                       w-full h-full md:w-[360px] md:max-w-[calc(100vw-2rem)] md:h-[480px]
                       bg-white md:rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)]
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-nimbus-600 to-nimbus-500 flex items-center gap-3">
              {isDev && selectedUserId && (
                <button
                  onClick={() => { setSelectedUserId(null); setMessages([]) }}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">
                  {isDev
                    ? selectedUserId
                      ? conversations.find((c) => c.userId === selectedUserId)?.name ?? 'Cliente'
                      : 'Conversazioni clienti'
                    : 'Chat con lo Sviluppatore'}
                </p>
                <p className="text-white/70 text-xs truncate">
                  {isDev && !selectedUserId
                    ? 'Seleziona una conversazione'
                    : 'Richiedi un servizio o segnala un problema'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Dev conversation list */}
            {isDev && !selectedUserId ? (
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm px-6 text-center">
                    <User className="w-10 h-10 mb-3 opacity-40" />
                    <p>Nessun messaggio dai clienti</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.userId}
                      onClick={() => setSelectedUserId(c.userId)}
                      className="w-full text-left p-3 rounded-xl hover:bg-nimbus-50 transition-colors mb-1"
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {loading && messages.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-nimbus-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8 px-4">
                      <p className="mb-1">Benvenuto nella chat di supporto.</p>
                      <p className="text-xs">Scrivi per richiedere un servizio o segnalare un problema.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isFromDev ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${msg.isFromDev
                              ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                              : 'bg-nimbus-500 text-white rounded-br-md'
                            }`}
                        >
                          {msg.isFromDev && (
                            <p className="text-[10px] font-semibold text-nimbus-600 mb-0.5">Sviluppatore</p>
                          )}
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                {showChat && (
                  <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Scrivi un messaggio..."
                      className="input-sm flex-1"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="btn-primary px-3 py-2 disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
