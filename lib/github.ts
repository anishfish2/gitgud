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
    type: string
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
            type: data.type,
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

export async function getProfileReadme(login: string): Promise<string | null> {
    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw', // Request raw content
        'User-Agent': 'GitGud-App',
    }
    if (token) headers['Authorization'] = `token ${token}`

    try {
        // Try to fetch from the special repo: username/username
        const res = await fetch(`${GITHUB_API_BASE}/repos/${login}/${login}/readme`, {
            headers,
            next: { revalidate: 86400 }, // Cache for 24 hours
        })

        if (!res.ok) return null
        return await res.text()
    } catch (error) {
        console.error('Error fetching README:', error)
        return null
    }
}

export interface RepoInfo {
    name: string
    description: string | null
    stargazers_count: number
    language: string | null
    html_url: string
}

export async function getTopRepos(login: string): Promise<RepoInfo[]> {
    const token = process.env.GITHUB_TOKEN
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitGud-App',
    }
    if (token) headers['Authorization'] = `token ${token}`

    try {
        const res = await fetch(`${GITHUB_API_BASE}/users/${login}/repos?sort=stars&per_page=5`, {
            headers,
            next: { revalidate: 3600 },
        })

        if (!res.ok) return []

        const repos = await res.json()
        return repos.map((r: any) => ({
            name: r.name,
            description: r.description,
            stargazers_count: r.stargazers_count,
            language: r.language,
            html_url: r.html_url,
        }))
    } catch (error) {
        console.error('Error fetching top repos:', error)
        return []
    }
}
