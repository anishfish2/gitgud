import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { update, Rating } from '@/lib/glicko'

export async function POST(request: Request) {
    try {
        const { matchId, winner } = await request.json()
        const cookieStore = await cookies()
        const sessionId = cookieStore.get('session_id')?.value

        if (!matchId || !winner) {
            return NextResponse.json({ error: 'Missing matchId or winner' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Fetch Match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single()

        if (matchError || !match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        // Verify rater (optional strict check)
        if (match.rater_id !== sessionId) {
            // Allow it for now, but in prod we might want to enforce session match
            // console.warn('Rater mismatch', match.rater_id, sessionId)
        }

        // 2. Check if already voted
        const { data: existingVote } = await supabase
            .from('votes')
            .select('id')
            .eq('match_id', matchId)
            .single()

        if (existingVote) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 })
        }

        // 3. Handle Skip
        if (winner === 'skip') {
            await supabase.from('votes').insert({
                match_id: matchId,
                winner_id: null,
            })
            return NextResponse.json({ message: 'Skipped' })
        }

        // 4. Handle Vote
        const isLeftWinner = winner === 'left'
        const winnerId = isLeftWinner ? match.left_profile_id : match.right_profile_id

        // Fetch current ratings
        const { data: ratings, error: ratingsError } = await supabase
            .from('ratings')
            .select('*')
            .in('profile_id', [match.left_profile_id, match.right_profile_id])

        if (ratingsError || !ratings || ratings.length !== 2) {
            return NextResponse.json({ error: 'Ratings not found' }, { status: 500 })
        }

        const leftRating = ratings.find(r => r.profile_id === match.left_profile_id)
        const rightRating = ratings.find(r => r.profile_id === match.right_profile_id)

        // Calculate new ratings
        const outcome = isLeftWinner ? 1 : 0
        const { newA, newB } = update(leftRating, rightRating, outcome)

        // Update DB
        // We do this in parallel or transaction. Supabase JS doesn't support transactions easily without RPC.
        // We'll just await both updates.
        await Promise.all([
            supabase.from('ratings').update(newA).eq('profile_id', match.left_profile_id),
            supabase.from('ratings').update(newB).eq('profile_id', match.right_profile_id),
            supabase.from('votes').insert({
                match_id: matchId,
                winner_id: winnerId,
            }),
        ])

        // 5. Award Credits
        if (sessionId) {
            // Upsert credits
            // We need to read first or use upsert logic
            const { data: credits } = await supabase
                .from('session_credits')
                .select('credits')
                .eq('session_hash', sessionId)
                .single()

            const currentCredits = credits?.credits || 0
            await supabase.from('session_credits').upsert({
                session_hash: sessionId,
                credits: currentCredits + 1,
                last_active_at: new Date().toISOString(),
            })
        }

        return NextResponse.json({ message: 'Voted', newRatings: { left: newA, right: newB } })

    } catch (error) {
        console.error('Vote API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
