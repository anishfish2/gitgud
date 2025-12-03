'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Users, Book, Code, MapPin, Link as LinkIcon, Building, Calendar, Twitter, FileText } from 'lucide-react'
import Image from 'next/image'
import { ProfileModal } from './ProfileModal'

interface Profile {
    id: string
    login: string
    avatar_url: string
    bio: string | null
    html_url: string
    followers: number
    public_repos: number
    company?: string | null
    location?: string | null
    blog?: string | null
    twitter_username?: string | null
    gh_created_at?: string
    top_languages?: Record<string, number>
    top_repos?: any[]
    readme_content?: string | null
}

interface VoteCardProps {
    profile: Profile
    onVote: () => void
    disabled?: boolean
    result?: 'win' | 'lose' | null
}

export function VoteCard({ profile, onVote, disabled, result }: VoteCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const joinedYear = profile.gh_created_at ? new Date(profile.gh_created_at).getFullYear() : null
    const topLangs = profile.top_languages ? Object.entries(profile.top_languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([lang]) => lang) : []

    return (
        <>
            <motion.div
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                className={`
        relative flex flex-col items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 w-full bg-zinc-900/80 backdrop-blur-sm
        ${result === 'win' ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : ''}
        ${result === 'lose' ? 'border-red-500/50 opacity-50 grayscale' : ''}
        ${!result ? 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900' : ''}
      `}
                onClick={() => !disabled && onVote()}
            >
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl shrink-0">
                    <Image
                        src={profile.avatar_url}
                        alt={profile.login}
                        fill
                        className="object-cover"
                    />
                </div>

                <div className="text-center mb-4 w-full">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2 truncate">
                        <a
                            href={profile.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline decoration-purple-500 underline-offset-4 transition-all"
                        >
                            {profile.login}
                        </a>
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-zinc-400">
                        {profile.location && (
                            <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>
                        )}
                        {profile.company && (
                            <span className="flex items-center gap-1"><Building size={12} /> {profile.company}</span>
                        )}
                        {joinedYear && (
                            <span className="flex items-center gap-1"><Calendar size={12} /> Joined {joinedYear}</span>
                        )}
                    </div>
                </div>

                <p className="text-zinc-400 text-sm text-center mb-6 line-clamp-3 min-h-[3rem] px-2 w-full">
                    {profile.bio || 'No bio available'}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-4">
                    <a
                        href={`${profile.html_url}?tab=followers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center p-2 rounded-lg bg-zinc-950/50 hover:bg-zinc-900/80 transition-colors group/stat border border-zinc-800/50"
                    >
                        <Users size={16} className="text-blue-400 mb-1 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-lg font-bold text-white">{profile.followers || 0}</span>
                        <span className="text-xs text-zinc-500">Followers</span>
                    </a>
                    <a
                        href={`${profile.html_url}?tab=repositories`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center p-2 rounded-lg bg-zinc-950/50 hover:bg-zinc-900/80 transition-colors group/stat border border-zinc-800/50"
                    >
                        <Book size={16} className="text-purple-400 mb-1 group-hover/stat:scale-110 transition-transform" />
                        <span className="text-lg font-bold text-white">{profile.public_repos || 0}</span>
                        <span className="text-xs text-zinc-500">Repos</span>
                    </a>
                </div>

                {/* Activity Graph */}
                <div className="w-full mb-4">
                    <div className="text-xs text-zinc-500 mb-1 font-bold uppercase tracking-wider">Activity</div>
                    <div className="bg-zinc-950/50 rounded-lg p-2 border border-zinc-800/50 overflow-hidden">
                        {/* Using ghchart.rshah.org for now as it's the easiest way to get the graph without complex scraping */}
                        <img
                            src={`https://ghchart.rshah.org/4ade80/${profile.login}`}
                            alt="Contribution Graph"
                            className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>

                {/* Top Repos */}
                {profile.top_repos && profile.top_repos.length > 0 && (
                    <div className="w-full mb-4">
                        <div className="text-xs text-zinc-500 mb-2 font-bold uppercase tracking-wider">Top Repositories</div>
                        <div className="space-y-2">
                            {profile.top_repos.slice(0, 3).map((repo: any) => (
                                <a
                                    key={repo.name}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="block p-2 rounded-lg bg-zinc-950/30 hover:bg-zinc-900/80 border border-zinc-800/30 hover:border-zinc-700 transition-all group/repo"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-zinc-300 group-hover/repo:text-purple-400 transition-colors truncate">{repo.name}</span>
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <span className="text-yellow-500">★</span> {repo.stargazers_count}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate">{repo.description}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extra Info */}
                <div className="w-full space-y-2 text-sm mt-auto">
                    {topLangs.length > 0 && (
                        <div className="flex items-center gap-2 justify-center mb-2">
                            <Code size={14} className="text-yellow-500" />
                            <div className="flex gap-2">
                                {topLangs.map(lang => (
                                    <span key={lang} className="bg-zinc-800 px-2 py-0.5 rounded-full text-xs text-zinc-300 border border-zinc-700">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center gap-4 pt-2 border-t border-zinc-800/50">
                        {profile.blog && (
                            <a
                                href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-500 hover:text-white transition-colors"
                                title="Website"
                            >
                                <LinkIcon size={16} />
                            </a>
                        )}
                        {profile.twitter_username && (
                            <a
                                href={`https://twitter.com/${profile.twitter_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-500 hover:text-blue-400 transition-colors"
                                title="Twitter"
                            >
                                <Twitter size={16} />
                            </a>
                        )}
                        <a
                            href={profile.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="GitHub Profile"
                        >
                            <Github size={16} />
                        </a>
                    </div>
                </div>

                {/* README Modal Trigger -> Now "View Full Profile" */}
                <div className="w-full mt-4 pt-4 border-t border-zinc-800/50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsModalOpen(true)
                        }}
                        className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <FileText size={16} /> View Full Profile
                    </button>
                </div>

                {/* Keyboard Hint */}
                <div className="absolute bottom-2 right-2 text-[10px] text-zinc-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to vote
                </div>
            </motion.div>

            <ProfileModal
                profile={profile}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
