'use client'

import { createClient } from '@/utils/supabase/client'
import { Trophy, ArrowLeft, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LeaderboardEntry {
    profile_id: string
    mu: number
    phi: number
    score: number
    games_played: number
    profiles: {
        login: string
        avatar_url: string
        bio: string | null
        followers: number
        public_repos: number
        top_languages: Record<string, number>
    }
}

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [filteredEntries, setFilteredEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState('')
    const [minMatches, setMinMatches] = useState(0)
    const [minFollowers, setMinFollowers] = useState(0)
    const [minRepos, setMinRepos] = useState(0)
    const [selectedLang, setSelectedLang] = useState('All')
    const [sortBy, setSortBy] = useState<'rank' | 'matches' | 'followers' | 'repos'>('rank')

    // Stats
    const [languageWars, setLanguageWars] = useState<any[]>([])
    const [gems, setGems] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // Fetch top 200 for client-side filtering
            const { data } = await supabase
                .from('ratings')
                .select('profile_id, mu, phi, score, games_played, profiles(*)')
                .order('score', { ascending: false })
                .limit(200)

            if (data) {
                setEntries(data as any)
                setFilteredEntries(data as any)
                calculateStats(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    useEffect(() => {
        let result = [...entries]

        // Filter by Search
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(e => e.profiles.login.toLowerCase().includes(q))
        }

        // Filter by Min Matches
        if (minMatches > 0) {
            result = result.filter(e => e.games_played >= minMatches)
        }

        // Filter by Min Followers
        if (minFollowers > 0) {
            result = result.filter(e => e.profiles.followers >= minFollowers)
        }

        // Filter by Min Repos
        if (minRepos > 0) {
            result = result.filter(e => e.profiles.public_repos >= minRepos)
        }

        // Filter by Language
        if (selectedLang !== 'All') {
            result = result.filter(e => {
                const langs = e.profiles.top_languages || {}
                return Object.keys(langs).includes(selectedLang)
            })
        }

        // Sort
        if (sortBy === 'matches') {
            result.sort((a, b) => b.games_played - a.games_played)
        } else if (sortBy === 'followers') {
            result.sort((a, b) => b.profiles.followers - a.profiles.followers)
        } else if (sortBy === 'repos') {
            result.sort((a, b) => b.profiles.public_repos - a.profiles.public_repos)
        } else {
            // Default Rank (Rating/Mu)
            result.sort((a, b) => b.mu - a.mu)
        }

        setFilteredEntries(result)
    }, [search, minMatches, minFollowers, minRepos, selectedLang, sortBy, entries])

    const calculateStats = (data: any[]) => {
        // Language Wars
        const languageStats: Record<string, { totalMu: number; count: number }> = {}
        data.forEach((entry: any) => {
            const langs = entry.profiles?.top_languages
            if (langs) {
                let topLang = 'Unknown'
                let maxCount = 0
                Object.entries(langs).forEach(([lang, count]: [string, any]) => {
                    if (count > maxCount) {
                        maxCount = count
                        topLang = lang
                    }
                })
                if (topLang !== 'Unknown') {
                    if (!languageStats[topLang]) languageStats[topLang] = { totalMu: 0, count: 0 }
                    languageStats[topLang].totalMu += entry.mu
                    languageStats[topLang].count += 1
                }
            }
        })

        const wars = Object.entries(languageStats)
            .map(([lang, stats]) => ({
                language: lang,
                avgMu: Math.round(stats.totalMu / stats.count),
                count: stats.count,
            }))
            .filter((l) => l.count >= 3)
            .sort((a, b) => b.avgMu - a.avgMu)
            .slice(0, 5)
        setLanguageWars(wars)

        // Gems
        const foundGems = data
            .filter((e: any) => e.profiles.followers < 100 && e.games_played > 5)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 10)
        setGems(foundGems)
    }

    // Extract all available languages for dropdown
    const allLanguages = Array.from(new Set(entries.flatMap(e => Object.keys(e.profiles.top_languages || {})))).sort()

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Vote
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Leaderboard
                    </h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Language Wars */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-purple-400">⚔️</span> Language Wars
                        </h2>
                        <div className="space-y-3">
                            {languageWars.map((l, i) => (
                                <div key={l.language} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono w-4">#{i + 1}</span>
                                        <span className="font-bold">{l.language}</span>
                                        <span className="text-xs text-zinc-600">({l.count})</span>
                                    </div>
                                    <div className="font-mono text-green-400">{l.avgMu}</div>
                                </div>
                            ))}
                            {languageWars.length === 0 && <p className="text-zinc-500 text-sm">Not enough data yet.</p>}
                        </div>
                    </div>

                    {/* Underrated Gems */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-blue-400">💎</span> Underrated Gems
                            <span className="text-xs font-normal text-zinc-500 ml-2">(High Rank, &lt;100 Followers)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gems.map((entry: any) => (
                                <div key={entry.profile_id} className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                                        <Image src={entry.profiles.avatar_url} alt={entry.profiles.login} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{entry.profiles.login}</div>
                                        <div className="text-xs text-green-400 font-mono">Rating: {Math.round(entry.mu)}</div>
                                    </div>
                                </div>
                            ))}
                            {gems.length === 0 && <p className="text-zinc-500 text-sm">No gems found yet.</p>}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-zinc-400 mr-2">
                        <Filter size={18} /> <span className="font-bold text-sm uppercase tracking-wider">Filters</span>
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-purple-500 w-40"
                        />
                    </div>

                    <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                    >
                        <option value="All">All Languages</option>
                        {allLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                    >
                        <option value="rank">Sort by Rank</option>
                        <option value="matches">Sort by Matches</option>
                        <option value="followers">Sort by Followers</option>
                        <option value="repos">Sort by Repos</option>
                    </select>

                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>Min Matches:</span>
                        <input
                            type="number"
                            value={minMatches}
                            onChange={(e) => setMinMatches(Number(e.target.value))}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 w-16 text-center"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>Min Followers:</span>
                        <input
                            type="number"
                            value={minFollowers}
                            onChange={(e) => setMinFollowers(Number(e.target.value))}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 w-16 text-center"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>Min Repos:</span>
                        <input
                            type="number"
                            value={minRepos}
                            onChange={(e) => setMinRepos(Number(e.target.value))}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 w-16 text-center"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">Rank</th>
                                    <th className="p-4 font-medium">Profile</th>
                                    <th className="p-4 font-medium text-right">Rating</th>
                                    <th className="p-4 font-medium text-right hidden md:table-cell">Matches</th>
                                    <th className="p-4 font-medium text-right hidden md:table-cell">Followers</th>
                                    <th className="p-4 font-medium text-right hidden md:table-cell">Repos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                                            Loading leaderboard...
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry, index) => (
                                        <tr key={entry.profile_id} className="hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-4 text-zinc-500 font-mono w-16">#{index + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700 shrink-0">
                                                        <Image
                                                            src={entry.profiles.avatar_url}
                                                            alt={entry.profiles.login}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-white truncate">{entry.profiles.login}</div>
                                                        <div className="text-xs text-zinc-500 truncate max-w-[120px] md:max-w-[200px]">
                                                            {entry.profiles.bio}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-mono text-green-400 font-bold">
                                                    {Math.round(entry.mu)}
                                                </div>
                                                <div className="text-xs text-zinc-600">
                                                    ±{Math.round(entry.phi * 2)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-zinc-400 hidden md:table-cell">
                                                {entry.games_played}
                                            </td>
                                            <td className="p-4 text-right text-zinc-400 hidden md:table-cell">
                                                {entry.profiles.followers}
                                            </td>
                                            <td className="p-4 text-right text-zinc-400 hidden md:table-cell">
                                                {entry.profiles.public_repos}
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!loading && filteredEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                                            No profiles match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    )
}
