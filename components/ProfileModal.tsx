'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Github, Users, Book, Code, MapPin, Link as LinkIcon, Building, Calendar, Twitter, FileText, Star, GitCommit } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

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

interface ProfileModalProps {
    profile: Profile | null
    isOpen: boolean
    onClose: () => void
}

export function ProfileModal({ profile, isOpen, onClose }: ProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'readme' | 'activity'>('overview')

    if (!profile) return null

    const joinedYear = profile.gh_created_at ? new Date(profile.gh_created_at).getFullYear() : null
    const topLangs = profile.top_languages ? Object.entries(profile.top_languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5) : []

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-zinc-800 flex items-start gap-6 bg-zinc-900/50">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-800 shrink-0">
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.login}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-bold text-white truncate">{profile.login}</h2>
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                                        >
                                            <X size={24} className="text-zinc-400" />
                                        </button>
                                    </div>
                                    <p className="text-zinc-400 mt-1 line-clamp-2">{profile.bio}</p>

                                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-zinc-500">
                                        {profile.company && <span className="flex items-center gap-1"><Building size={14} /> {profile.company}</span>}
                                        {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
                                        {joinedYear && <span className="flex items-center gap-1"><Calendar size={14} /> Joined {joinedYear}</span>}
                                        <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Github size={14} /> GitHub</a>
                                        {profile.blog && <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><LinkIcon size={14} /> Website</a>}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-zinc-800 px-6">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('readme')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'readme' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    README
                                </button>
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-purple-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Activity
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 flex flex-col items-center">
                                                <Users className="text-blue-400 mb-2" />
                                                <span className="text-2xl font-bold text-white">{profile.followers}</span>
                                                <span className="text-xs text-zinc-500">Followers</span>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 flex flex-col items-center">
                                                <Book className="text-purple-400 mb-2" />
                                                <span className="text-2xl font-bold text-white">{profile.public_repos}</span>
                                                <span className="text-xs text-zinc-500">Repositories</span>
                                            </div>
                                            {/* Add more stats if available */}
                                        </div>

                                        {/* Languages */}
                                        {topLangs.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Code size={20} /> Top Languages</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {topLangs.map(([lang, count]) => (
                                                        <div key={lang} className="bg-zinc-800 px-3 py-1 rounded-full text-sm text-zinc-300 border border-zinc-700 flex items-center gap-2">
                                                            <span>{lang}</span>
                                                            <span className="text-zinc-500 text-xs">{count} repos</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Repos */}
                                        {profile.top_repos && profile.top_repos.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Star size={20} /> Top Repositories</h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {profile.top_repos.map((repo: any) => (
                                                        <a
                                                            key={repo.name}
                                                            href={repo.html_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block p-4 rounded-xl bg-zinc-950/30 hover:bg-zinc-900/80 border border-zinc-800/30 hover:border-zinc-700 transition-all group"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-bold text-zinc-200 group-hover:text-purple-400 transition-colors">{repo.name}</span>
                                                                <span className="text-xs text-zinc-500 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-full">
                                                                    <span className="text-yellow-500">★</span> {repo.stargazers_count}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-zinc-500 line-clamp-2 mb-3 h-10">{repo.description}</p>
                                                            {repo.language && (
                                                                <span className="text-xs text-zinc-600 flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                                    {repo.language}
                                                                </span>
                                                            )}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'readme' && (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        {profile.readme_content ? (
                                            <ReactMarkdown
                                                components={{
                                                    img: ({ node, ...props }) => <img {...props} className="max-w-full rounded-lg" style={{ maxHeight: '400px' }} />
                                                }}
                                            >
                                                {profile.readme_content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="text-center py-20 text-zinc-500">
                                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>No README found for this profile.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 self-start"><GitCommit size={20} /> Contribution Graph</h3>
                                        <div className="bg-white/5 p-4 rounded-xl overflow-x-auto max-w-full">
                                            <img
                                                src={`https://ghchart.rshah.org/4ade80/${profile.login}`}
                                                alt="Contribution Graph"
                                                className="min-w-[700px]"
                                            />
                                        </div>
                                        <p className="mt-4 text-sm text-zinc-500">
                                            Data provided by ghchart.rshah.org
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
