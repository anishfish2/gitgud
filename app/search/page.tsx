'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Search as SearchIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        const supabase = createClient()

        // Simple search: match login or bio
        // Note: Supabase text search is better with FTS, but ilike is fine for small scale
        const { data } = await supabase
            .from('profiles')
            .select('*, ratings(mu, score)')
            .or(`login.ilike.%${query}%,bio.ilike.%${query}%`)
            .limit(20)

        setResults(data || [])
        setLoading(false)
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Vote
                    </Link>
                    <h1 className="text-2xl font-bold">Find Profiles</h1>
                </div>

                <form onSubmit={handleSearch} className="relative mb-12">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by username, language, or keyword..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-200 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                    </button>
                </form>

                <div className="space-y-4">
                    {searched && results.length === 0 && !loading && (
                        <div className="text-center text-zinc-500 py-12">
                            No profiles found matching "{query}".
                        </div>
                    )}

                    {results.map((profile) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={profile.id}
                            className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition-colors"
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.login}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg truncate">{profile.login}</h3>
                                    <span className="font-mono text-green-400 text-sm">
                                        {profile.ratings?.[0]?.mu ? Math.round(profile.ratings[0].mu) : 'Unranked'}
                                    </span>
                                </div>
                                <p className="text-zinc-500 text-sm truncate">{profile.bio || 'No bio'}</p>
                                {profile.top_languages && (
                                    <div className="flex gap-2 mt-2">
                                        {Object.keys(profile.top_languages).slice(0, 3).map(lang => (
                                            <span key={lang} className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full text-zinc-400">
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </main>
    )
}
