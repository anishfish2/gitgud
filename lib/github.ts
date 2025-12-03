const GITHUB_API_BASE = 'https://api.github.com'

export interface GitHubUser {
    id: number
    login: string
    name: string | null
    avatar_url: string
    bio: string | null
    html_url: string
    followers: number
    public_repos: number
    company: string | null
    location: string | null
    blog: string | null
    twitter_username: string | null
    created_at: string
}

export async function getGitHubUser(login: string): Promise<GitHubUser | null> {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
        console.warn('GITHUB_TOKEN is not set. Rate limits will be strict.')
    }

    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitGud-App',
    }

    if (token) {
        headers['Authorization'] = `token ${token}`
    }

    try {
        const res = await fetch(`${GITHUB_API_BASE}/users/${login}`, {
            headers,
            next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (res.status === 404) return null
        if (!res.ok) {
            console.error(`GitHub API error: ${res.status} ${res.statusText}`)
            return null
        }

        const data = await res.json()
        return {
            id: data.id,
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
            bio: data.bio,
            html_url: data.html_url,
            followers: data.followers,
            public_repos: data.public_repos,
            company: data.company,
            location: data.location,
            blog: data.blog,
            twitter_username: data.twitter_username,
            created_at: data.created_at,
        }
    } catch (error) {
        console.error('Error fetching GitHub user:', error)
        return null
    }
}

export async function getTopLanguages(login: string): Promise<Record<string, number>> {
    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitGud-App',
    }
    if (token) headers['Authorization'] = `token ${token}`

    try {
        // Fetch top 10 repos by stars
        const res = await fetch(`${GITHUB_API_BASE}/users/${login}/repos?sort=pushed&per_page=10`, {
            headers,
            next: { revalidate: 3600 },
        })

        if (!res.ok) return {}

        const repos = await res.json()
        const languageCounts: Record<string, number> = {}

        for (const repo of repos) {
            if (repo.language) {
                languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
            }
        }

        return languageCounts
    } catch (error) {
        console.error('Error fetching languages:', error)
        return {}
    }
}
