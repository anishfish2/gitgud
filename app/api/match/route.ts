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
            const useNewcomer = Math.random() < 0.6 // Increased newcomer chance to 60%

            if (useNewcomer) {
                // 1. Priority: Find profiles with ZERO matches
                const { data: zeroMatchIds } = await supabase
                    .from('ratings')
                    .select('profile_id')
                    .eq('games_played', 0)

                let newcomerId = null

                if (zeroMatchIds && zeroMatchIds.length > 0) {
                    // Pick random zero-match profile
                    newcomerId = zeroMatchIds[Math.floor(Math.random() * zeroMatchIds.length)].profile_id
                } else {
                    // 2. Fallback: Find profiles with < 5 matches or high uncertainty
                    const { data: newcomerIds } = await supabase
                        .from('ratings')
                        .select('profile_id')
                        .or(`games_played.lt.${NEWCOMER_GAMES_THRESHOLD},phi.gt.${NEWCOMER_PHI_THRESHOLD}`)

                    if (newcomerIds && newcomerIds.length > 0) {
                        newcomerId = newcomerIds[Math.floor(Math.random() * newcomerIds.length)].profile_id
                    }
                }

                if (newcomerId) {
                    // Fetch full profile for newcomer
                    const { data: newcomerProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', newcomerId)
                        .single()

                    if (newcomerProfile) {
                        leftProfile = newcomerProfile

                        // Fetch ALL anchor IDs
                        const { data: anchorIds } = await supabase
                            .from('ratings')
                            .select('profile_id')
                            .lt('phi', ANCHOR_PHI_THRESHOLD)
                            .gte('games_played', NEWCOMER_GAMES_THRESHOLD)

                        if (anchorIds && anchorIds.length > 0) {
                            const randomAnchor = anchorIds[Math.floor(Math.random() * anchorIds.length)]
                            const { data: anchorProfile } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', randomAnchor.profile_id)
                                .single()

                            rightProfile = anchorProfile
                        }
                    }
                }
            }

            // Fallback to Standard Matchmaking (or if Newcomer failed)
            if (!leftProfile || !rightProfile) {
                // Fetch ALL profile IDs
                const { data: allIds } = await supabase
                    .from('profiles')
                    .select('id')

                if (!allIds || allIds.length < 2) {
                    return NextResponse.json({ error: 'Not enough profiles' }, { status: 404 })
                }

                // Pick 2 distinct random IDs
                const idx1 = Math.floor(Math.random() * allIds.length)
                let idx2 = Math.floor(Math.random() * allIds.length)
                while (idx1 === idx2) {
                    idx2 = Math.floor(Math.random() * allIds.length)
                }

                const id1 = allIds[idx1].id
                const id2 = allIds[idx2].id

                // Fetch full profiles
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', [id1, id2])

                if (profiles && profiles.length === 2) {
                    leftProfile = profiles[0]
                    rightProfile = profiles[1]
                }
            }

            if (!leftProfile || !rightProfile) continue
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
        }

        if (!leftProfile || !rightProfile) {
            // Last resort: just grab any 2 (should rarely happen)
            const { data: panicProfiles } = await supabase
                .from('profiles')
                .select('*')
                .limit(2)

            if (panicProfiles && panicProfiles.length === 2) {
                leftProfile = panicProfiles[0]
                rightProfile = panicProfiles[1]
                pairHash = [leftProfile.id, rightProfile.id].sort().join(':')
            } else {
                return NextResponse.json({ error: 'Failed to find pair' }, { status: 500 })
            }
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
