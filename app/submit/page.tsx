'use client'

import { useState } from 'react'
import { ArrowLeft, Github, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SubmitPage() {
    const [login, setLogin] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!login.trim()) return

        setStatus('loading')
        setMessage('')

        try {
            const res = await fetch('/api/submit-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: login.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                setStatus('error')
                setMessage(data.error || 'Failed to submit')
            } else {
                setStatus('success')
                setMessage(data.status === 'exists' ? 'Profile already exists!' : 'Profile added successfully!')
                setLogin('')
            }
        } catch (error) {
            setStatus('error')
            setMessage('Something went wrong')
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
            <div className="w-full max-w-md">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} /> Back to Vote
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                            <Github size={32} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center mb-2">Add a Profile</h1>
                    <p className="text-zinc-400 text-center mb-8 text-sm">
                        Submit a GitHub username to add them to the ranking pool.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">GitHub Username</label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="torvalds"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                disabled={status === 'loading'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading' || !login}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {status === 'loading' ? 'Verifying...' : 'Submit Profile'}
                        </button>
                    </form>

                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400 text-sm"
                        >
                            <CheckCircle size={16} />
                            {message}
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm"
                        >
                            <AlertCircle size={16} />
                            {message}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </main>
    )
}
