import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const NEWCOMER_GAMES_THRESHOLD = 5
const NEWCOMER_PHI_THRESHOLD = 100
const ANCHOR_PHI_THRESHOLD = 60

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        let sessionId = cookieStore.get('session_id')?.value
        if (!sessionId) {
            sessionId = uuidv4()
            // We can't set cookies in a GET handler easily in Next.js App Router without returning a response.
            // We'll return it in the response headers or body and let client set it, 
            // OR we just use it for this request and expect client to handle session generation if missing.
            // Better: Set it on the response.
        }

        const supabase = createAdminClient()

        let attempts = 0
        const MAX_ATTEMPTS = 5
        let leftProfile, rightProfile, pairHash

        while (attempts < MAX_ATTEMPTS) {
            attempts++
            leftProfile = null
            rightProfile = null

            // 1. Decide strategy: Newcomer vs Standard
            const useNewcomer = Math.random() < 0.5

            if (useNewcomer) {
                // Find a newcomer
                const { data: newcomers } = await supabase
                    .from('ratings')
                    .select('profile_id, mu, phi, games_played, profiles(*)')
                    .or(`games_played.lt.${NEWCOMER_GAMES_THRESHOLD},phi.gt.${NEWCOMER_PHI_THRESHOLD}`)
                    .limit(20)

                if (newcomers && newcomers.length > 0) {
                    const newcomer = newcomers[Math.floor(Math.random() * newcomers.length)]
                    leftProfile = newcomer.profiles

                    const { data: anchors } = await supabase
                        .from('ratings')
                        .select('profile_id, mu, phi, profiles(*)')
                        .lt('phi', ANCHOR_PHI_THRESHOLD)
                        .gte('games_played', NEWCOMER_GAMES_THRESHOLD)
                        .order('mu', { ascending: true })
                        .limit(50)

                    if (anchors && anchors.length > 0) {
                        const anchor = anchors[Math.floor(Math.random() * anchors.length)]
                        rightProfile = anchor.profiles
                    }
                }
            }

            // Fallback to Standard Matchmaking
            if (!leftProfile || !rightProfile) {
                const { data: candidates } = await supabase
                    .from('profiles')
                    .select('*, ratings!inner(mu, phi)')
                    .limit(50)

                if (!candidates || candidates.length < 2) {
                    return NextResponse.json({ error: 'Not enough profiles' }, { status: 404 })
                }

                const shuffled = candidates.sort(() => 0.5 - Math.random())
                leftProfile = shuffled[0]
                rightProfile = shuffled[1]
            }

            if (leftProfile.id === rightProfile.id) continue

            // Check for duplicate match
            pairHash = [leftProfile.id, rightProfile.id].sort().join(':')

            const { data: existing } = await supabase
                .from('matches')
                .select('id')
                .eq('rater_id', sessionId)
                .eq('pair_hash', pairHash)
                .single()

            if (!existing) {
                break // Found a fresh pair
            }
            // If existing, loop again
        }

        if (!leftProfile || !rightProfile) {
            return NextResponse.json({ error: 'Failed to find pair' }, { status: 500 })
        }

        // Create Match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
                left_profile_id: leftProfile.id,
                right_profile_id: rightProfile.id,
                pair_hash: pairHash,
                rater_id: sessionId,
            })
            .select()
            .single()

        if (matchError) {
            console.error('Match insert error:', matchError)
            return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
        }

        const response = NextResponse.json({
            matchId: match.id,
            left: leftProfile,
            right: rightProfile
        })

        // Set session cookie if it was new
        if (!cookieStore.get('session_id')) {
            response.cookies.set('session_id', sessionId, { httpOnly: true, path: '/' })
        }

        return response

    } catch (error) {
        console.error('Match API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
