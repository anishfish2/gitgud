'use client'

import { useState } from 'react'

const PROFILES_TO_SEED = [
    'ashishps1', 'Alvin9999', 'hiyouga', 'fffaraz', 'ageron', 'llSourcell', 'geerlingguy', 'gorhill',
    'lencx', 'rstacruz', 'ryanoasis', 'schollz', 'leonardomso', 'jgthms', 'binhnguyennus', 'juliangarnier',
    'amusi', 'topjohnwu', 'kdn251', 'amitshekhariitbhu', 'nicklockwood', 'eriklindernoren', 'soimort',
    'chrislgarry', 'skywind3000', 'evanw', 'antfu', 'jondot', 'dtolnay', 'lyswhut', 'ageitgey', 'PlexPt',
    'skydoves', 'tidwall', 'cmliu', 'xingshaocheng', 'adam-p', 'azl397985856', '1c7', 'charlax', 'unknwon',
    'CorentinJ', 'lukeed', 'Solido', 'laurent22', 'addyosmani', 'scutan90', 'YunaiV', 'romkatv', 'karan',
    'mattn', 'WerWolv', 'fogleman', 'jakevdp', 'sdras', 'mathiasbynens', 'tw93', 'streamich', 'astaxie',
    'AntonOsika', 'hehonghui', 'zenorocha', 'antirez', 'wagoodman', 'oblador', 'kentcdodds', 'tiimgreen',
    'poteto', 'NARKOZ', 'CarGuo', 'Blankj', 'JedWatson', 'vsouza', 'ngosang', 'simonw', 'bevacqua',
    'brillout', 'ai', 'ziishaned', 'PatrickJS', 'blueimp', 'alyssaxuu', 'mingrammer', 'dani-garcia',
    'mafintosh', 'dkhamsing', 'gedoor', 'aymericdamien', 'halfrost', 'rougier', 'iamkun', 'mgechev',
    'nhn', 'agalwood', 'keon', 'sahat', 'coreybutler', 'jgm', 'nlohmann', 'denysdovhan', 'florent37',
    'alex', 'GokuMohandas', 'sorrycc', 'kovidgoyal', 'ityouknow', 'barryvdh', 'onevcat', 'vadimdemedes',
    'daimajia', 'LeCoupa', 'nolimits4web', 'AllThingsSmitty', 'serhii-londar', 'junyanz', 'gaearon',
    'xinntao', 'skylot', 'zhaoolee', 'transitive-bullshit', 'bee-san', 'akullpp', 'floodsung', 'Jack-Cherish',
    'dypsilon', 'alvarotrigo', 'hongyangAndroid', 'eugeneyan', 'ymcui', 'DovAmir', 'GitSquared', 'max-mapper',
    'formulahendry', 'Unitech', 'iperov', 'jorgebucaran', 'acheong08', 'lenve', 'mifi', 'remy', 'hankcs',
    'colinhacks', 'ianstormtaylor', 'fengyuanchen', 'k88hudson', 'huihut', 'ahmetb', 'faif', 'crossoverJie',
    'felixrieseberg'
]

export default function SeedPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [isSeeding, setIsSeeding] = useState(false)
    const [progress, setProgress] = useState(0)

    const seed = async () => {
        setIsSeeding(true)
        setLogs([])
        setProgress(0)

        for (let i = 0; i < PROFILES_TO_SEED.length; i++) {
            const username = PROFILES_TO_SEED[i]
            try {
                setLogs(prev => [`[${i + 1}/${PROFILES_TO_SEED.length}] Fetching ${username}...`, ...prev])

                const res = await fetch('/api/submit-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login: username })
                })

                const data = await res.json()

                if (res.ok) {
                    setLogs(prev => [`✅ Success: ${username} (${data.status})`, ...prev])
                } else {
                    setLogs(prev => [`❌ Error: ${username} - ${data.error}`, ...prev])
                }
            } catch (error) {
                setLogs(prev => [`❌ Failed: ${username}`, ...prev])
            }
            setProgress(((i + 1) / PROFILES_TO_SEED.length) * 100)
        }
        setIsSeeding(false)
        setLogs(prev => [`🎉 DONE! Processed ${PROFILES_TO_SEED.length} profiles.`, ...prev])
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-mono">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
            <div className="mb-4">
                <p className="text-zinc-400 mb-2">Profiles to seed: {PROFILES_TO_SEED.length}</p>
                <button
                    onClick={seed}
                    disabled={isSeeding}
                    className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-bold transition-colors"
                >
                    {isSeeding ? 'Seeding...' : 'Start Seeding'}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-zinc-800 rounded mb-4 overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 h-[600px] overflow-y-auto font-mono text-xs">
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
            </div>
        </div>
    )
}
