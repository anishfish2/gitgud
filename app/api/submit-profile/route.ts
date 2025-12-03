import { createAdminClient } from '@/utils/supabase/admin'
import { getGitHubUser, getTopLanguages } from '@/lib/github'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { login } = await request.json()

        if (!login || typeof login !== 'string') {
            return NextResponse.json({ error: 'Login is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Check if profile already exists
        const { data: existing } = await supabase
            .from('profiles')
            .select('id, login')
            .ilike('login', login)
            .single()

        if (existing) {
            return NextResponse.json({
                message: 'Profile already exists',
                profile: existing,
                status: 'exists'
            })
        }

        // 2. Fetch from GitHub
        const ghUser = await getGitHubUser(login)
        if (!ghUser) {
            return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 })
        }

        const topLanguages = await getTopLanguages(login)

        // 3. Insert into profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
                login: ghUser.login,
                github_id: ghUser.id,
                avatar_url: ghUser.avatar_url,
                bio: ghUser.bio,
                html_url: ghUser.html_url,
                followers: ghUser.followers,
                public_repos: ghUser.public_repos,
                company: ghUser.company,
                location: ghUser.location,
                blog: ghUser.blog,
                twitter_username: ghUser.twitter_username,
                gh_created_at: ghUser.created_at,
                top_languages: topLanguages,
                activity_band: ghUser.public_repos > 50 ? 2 : ghUser.public_repos > 10 ? 1 : 0,
                last_synced_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (profileError) {
            console.error('Profile insert error:', profileError)
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
        }

        // 4. Initialize ratings
        const { error: ratingError } = await supabase
            .from('ratings')
            .insert({
                profile_id: profile.id,
                mu: 1500,
                phi: 350, // High uncertainty for new profiles
                games_played: 0,
            })

        if (ratingError) {
            console.error('Rating insert error:', ratingError)
            // Should probably rollback profile, but for now just log
        }

        return NextResponse.json({
            message: 'Profile added',
            profile,
            status: 'added'
        })

    } catch (error) {
        console.error('Submit API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
