'use client'

import { useState, useEffect, useCallback } from 'react'
import { VoteCard } from '@/components/VoteCard'
import { Starfield } from '@/components/Starfield'
import { RefreshCw, SkipForward, Trophy, Plus, Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'

interface Match {
  matchId: string
  left: any
  right: any
}

export default function Home() {
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [result, setResult] = useState<'left' | 'right' | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/match')
      if (!res.ok) throw new Error('Failed to fetch match')
      const data = await res.json()
      setMatch(data)
      setResult(null)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setVoting(false)
    }
  }, [])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  const handleVote = async (winner: 'left' | 'right' | 'skip') => {
    if (!match || voting) return

    setVoting(true)

    if (winner !== 'skip') {
      setResult(winner)
      // Small delay to show result animation
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.matchId, winner }),
      })
    } catch (error) {
      console.error(error)
    }

    fetchMatch()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voting || loading) return
      if (e.key === 'ArrowLeft') handleVote('left')
      if (e.key === 'ArrowRight') handleVote('right')
      if (e.key === ' ' || e.key === 'ArrowDown') handleVote('skip')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [match, voting, loading])

  if (loading && !match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <RefreshCw className="animate-spin mb-4 text-purple-500" size={32} />
        <p className="text-zinc-500 animate-pulse">Finding worthy opponents...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950 p-4 overflow-hidden relative">
      <Starfield />

      {/* Header / Nav (Simple) */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-white">G</div>
          <span className="font-bold text-xl text-white tracking-tight">GitGud</span>
        </div>
        <div className="flex gap-4">
          <Link href="/search" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <SearchIcon size={16} /> Search
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <Trophy size={16} /> Leaderboard
          </Link>
          <Link href="/submit" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <Plus size={16} /> Add Profile
          </Link>
        </div>
      </nav>

      <div className="text-center mb-8 mt-6 md:mb-12 md:mt-10 relative z-10">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-4 tracking-tight">
          Who's Better?
        </h1>
        <p className="text-zinc-500 text-lg">Rank GitHub profiles based on vibes, code, and stats.</p>
      </div>

      {match && (
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-4xl relative z-10">
          <div className="flex-1 w-full max-w-sm">
            <VoteCard
              profile={match.left}
              onVote={() => handleVote('left')}
              disabled={voting}
              result={result ? (result === 'left' ? 'win' : 'lose') : null}
            />
            <div className="hidden md:block text-center mt-4 text-zinc-600 text-sm font-mono">Press ←</div>
          </div>

          <div className="flex flex-row md:flex-col items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 text-lg md:text-xl border border-zinc-800">
              VS
            </div>
            <button
              onClick={() => handleVote('skip')}
              disabled={voting}
              className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2 text-sm"
            >
              <SkipForward size={14} /> Skip
            </button>
          </div>

          <div className="flex-1 w-full max-w-sm">
            <VoteCard
              profile={match.right}
              onVote={() => handleVote('right')}
              disabled={voting}
              result={result ? (result === 'right' ? 'win' : 'lose') : null}
            />
            <div className="hidden md:block text-center mt-4 text-zinc-600 text-sm font-mono">Press →</div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 text-zinc-700 text-xs">
        Built with Next.js + Supabase + Glicko
      </div>
    </main>
  )
}
