/**
 * Quick test: create an OpenAI Realtime client secret (ephemeral token).
 * Run from backend: npx tsx src/scripts/test-openai-realtime.ts
 * Requires .env with OPENAI_API_KEY set.
 */
import 'dotenv/config'
import https from 'https'

const API_KEY = process.env.OPENAI_API_KEY
if (!API_KEY) {
    console.error('OPENAI_API_KEY not set in .env')
    process.exit(1)
}

function post(url: string, body: object): Promise<{ statusCode: number; body: string }> {
    const u = new URL(url)
    const data = JSON.stringify(body)
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                },
            },
            (res) => {
                const chunks: Buffer[] = []
                res.on('data', (chunk) => chunks.push(chunk))
                res.on('end', () =>
                    resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks).toString() })
                )
            }
        )
        req.on('error', reject)
        req.write(data)
        req.end()
    })
}

async function main() {
    const model = 'gpt-realtime'
    const instructions = 'You are a friendly assistant.'
    const voice = 'alloy'

    console.log('Calling OpenAI POST /v1/realtime/client_secrets (GA: audio.output.voice) ...')
    const { statusCode, body } = await post('https://api.openai.com/v1/realtime/client_secrets', {
        expires_after: { anchor: 'created_at', seconds: 3600 },
        session: {
            type: 'realtime',
            model,
            instructions,
            audio: {
                output: { voice },
            },
        },
    })

    console.log('Status:', statusCode)
    if (statusCode !== 200) {
        console.error('Response:', body)
        process.exit(1)
    }

    let data: { value?: string; expires_at?: number }
    try {
        data = JSON.parse(body)
    } catch {
        console.error('Invalid JSON:', body)
        process.exit(1)
    }

    if (data.value) {
        console.log('OK – ephemeral token received (starts with):', data.value.slice(0, 15) + '...')
        if (data.expires_at) console.log('Expires at (epoch):', data.expires_at)
    } else {
        console.error('No "value" in response:', data)
        process.exit(1)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
