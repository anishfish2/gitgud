import { createClient } from '@/utils/supabase/server'
import { Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60

export default async function Leaderboard() {
    const supabase = await createClient()

    // Fetch Leaderboard
    const { data: profiles } = await supabase
        .from('ratings')
        .select('profile_id, mu, phi, score, games_played, profiles(*)')
        .order('score', { ascending: false })
        .limit(50)

    // Fetch Underrated Gems (High Score, Low Followers)
    // Note: We need to join profiles to filter by followers, which is hard in one query with Supabase JS syntax
    // So we'll fetch top 100 ratings and filter in JS for now, or use a separate query if we had a view.
    // Let's try a separate query for "Gems"
    const { data: gems } = await supabase
        .from('ratings')
        .select('profile_id, mu, phi, score, games_played, profiles!inner(*)')
        .lt('profiles.followers', 100) // "Underrated" threshold
        .gt('games_played', 5) // Minimum games
        .order('score', { ascending: false })
        .limit(10)

    // Calculate Language Wars
    // We need a broader dataset for this. Let's fetch top 200 profiles to aggregate.
    const { data: allStats } = await supabase
        .from('ratings')
        .select('mu, profiles(top_languages)')
        .limit(200)

    const languageStats: Record<string, { totalMu: number; count: number }> = {}

    allStats?.forEach((entry: any) => {
        const langs = entry.profiles?.top_languages
        if (langs) {
            // Find top language for this user
            let topLang = 'Unknown'
            let maxCount = 0
            Object.entries(langs).forEach(([lang, count]: [string, any]) => {
                if (count > maxCount) {
                    maxCount = count
                    topLang = lang
                }
            })

            if (topLang !== 'Unknown') {
                if (!languageStats[topLang]) {
                    languageStats[topLang] = { totalMu: 0, count: 0 }
                }
                languageStats[topLang].totalMu += entry.mu
                languageStats[topLang].count += 1
            }
        }
    })

    const languageWars = Object.entries(languageStats)
        .map(([lang, stats]) => ({
            language: lang,
            avgMu: Math.round(stats.totalMu / stats.count),
            count: stats.count,
        }))
        .filter((l) => l.count >= 3) // Min 3 profiles to show
        .sort((a, b) => b.avgMu - a.avgMu)
        .slice(0, 5)

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Language Wars Card */}
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

                    {/* Underrated Gems Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-blue-400">💎</span> Underrated Gems
                            <span className="text-xs font-normal text-zinc-500 ml-2">(High Rank, &lt;100 Followers)</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gems?.map((entry: any) => (
                                <div key={entry.profile_id} className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                                        <Image
                                            src={entry.profiles.avatar_url}
                                            alt={entry.profiles.login}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{entry.profiles.login}</div>
                                        <div className="text-xs text-green-400 font-mono">Rating: {Math.round(entry.mu)}</div>
                                    </div>
                                </div>
                            ))}
                            {(!gems || gems.length === 0) && <p className="text-zinc-500 text-sm">No gems found yet.</p>}
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Global Ranking</h2>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Rank</th>
                                <th className="p-4 font-medium">Profile</th>
                                <th className="p-4 font-medium text-right">Rating</th>
                                <th className="p-4 font-medium text-right hidden md:table-cell">Matches</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {profiles?.map((entry: any, index: number) => (
                                <tr key={entry.profile_id} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="p-4 text-zinc-500 font-mono w-16">#{index + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-700">
                                                <Image
                                                    src={entry.profiles.avatar_url}
                                                    alt={entry.profiles.login}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{entry.profiles.login}</div>
                                                <div className="text-xs text-zinc-500 truncate max-w-[200px]">
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
                                </tr>
                            ))}

                            {(!profiles || profiles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                                        No profiles ranked yet. Be the first!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}
