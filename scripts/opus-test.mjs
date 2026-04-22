// Opus-vs-Sonnet extraction comparison harness.
// Runs 3 complex CFM lessons through runLessonPipeline twice each
// (Sonnet default + Opus extraction override), saves both outputs to
// lesson-database/opus-test/, and prints a diff summary.
//
// Usage: node scripts/opus-test.mjs
// Requires: ANTHROPIC_API_KEY in .env (or environment)

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runLessonPipeline } from '../api/_lib/pipeline.js'

// Minimal .env loader — avoids pulling in dotenv as a dep.
const __file = fileURLToPath(import.meta.url)
try {
    const envText = await readFile(resolve(dirname(__file), '../.env'), 'utf8')
    for (const line of envText.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!m) continue
        const [, k, raw] = m
        if (process.env[k]) continue
        process.env[k] = raw.replace(/^["']|["']$/g, '')
    }
} catch (e) {
    console.warn(`⚠ Could not read .env: ${e.message}`)
}

const OUT_DIR = resolve(dirname(__file), '../lesson-database/opus-test')

const MANUAL = 'https://www.churchofjesuschrist.org/study/manual/come-follow-me-for-home-and-church-old-testament-2026'

// Three lessons chosen for complexity:
//   16 — Tabernacle + Leviticus (the one that broke under Haiku)
//   28 — Psalms 102–150 (massive chapter range)
//   32 — Isaiah 1–12 (dense cross-referencing)
const TEST_LESSONS = [
    { slug: '16', label: 'Tabernacle/Leviticus' },
    { slug: '28', label: 'Psalms 102-150' },
    { slug: '32', label: 'Isaiah 1-12' },
]

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment or .env')
    process.exit(1)
}

await mkdir(OUT_DIR, { recursive: true })

const runs = []
for (const lesson of TEST_LESSONS) {
    const url = `${MANUAL}/${lesson.slug}?lang=eng`
    console.log(`\n━━━ ${lesson.label} (lesson ${lesson.slug}) ━━━`)

    for (const variant of [
        { name: 'sonnet', models: {} },
        { name: 'opus',   models: { extraction: 'claude-opus-4-7' } },
    ]) {
        console.log(`\n▶ ${variant.name.toUpperCase()} — ${url}`)
        const t0 = Date.now()
        const result = await runLessonPipeline({
            url,
            gameType: 'common-ground',
            apiKey,
            enableSafetyReview: false, // skip for the diag to keep it fast
            models: variant.models,
        })
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
        const outPath = resolve(OUT_DIR, `${lesson.slug}-${variant.name}.json`)
        await writeFile(outPath, JSON.stringify(result, null, 2))
        console.log(`  saved → ${outPath}`)
        console.log(`  elapsed: ${elapsed}s · status: ${result.status}`)

        runs.push({
            lesson: lesson.slug,
            label: lesson.label,
            variant: variant.name,
            elapsed: Number(elapsed),
            status: result.status,
            body: result.body,
        })
    }
}

// ── Diff summary ────────────────────────────────────────────────────────────
console.log('\n\n═══ DIFF SUMMARY ═══\n')
for (const lesson of TEST_LESSONS) {
    const sonnet = runs.find(r => r.lesson === lesson.slug && r.variant === 'sonnet')
    const opus   = runs.find(r => r.lesson === lesson.slug && r.variant === 'opus')
    console.log(`─── Lesson ${lesson.slug}: ${lesson.label} ───`)
    console.log(`  elapsed:  sonnet ${sonnet.elapsed}s  vs  opus ${opus.elapsed}s  (Δ ${(opus.elapsed - sonnet.elapsed).toFixed(1)}s)`)
    console.log(`  status:   sonnet ${sonnet.status}  opus ${opus.status}`)

    const sRounds = sonnet.body?.rounds?.length ?? 0
    const oRounds = opus.body?.rounds?.length ?? 0
    console.log(`  rounds:   sonnet ${sRounds}  opus ${oRounds}`)

    const crossManualHits = (body) => {
        if (!body?.rounds) return 0
        const stringified = JSON.stringify(body.rounds)
        let hits = 0
        for (const pattern of [/\bHelaman\b/, /\bNephi\b/, /\bMosiah\b/, /\bAlma\b/, /\bMormon\b/, /\bDoctrine and Covenants\b/, /\bD&C\b/, /\bMatthew\b/, /\bMark\b/, /\bLuke\b/, /\bJohn\b/, /\bRomans\b/]) {
            const m = stringified.match(new RegExp(pattern.source, 'g'))
            if (m) hits += m.length
        }
        return hits
    }
    console.log(`  cross-manual refs (BoM/D&C/NT in rounds):  sonnet ${crossManualHits(sonnet.body)}  opus ${crossManualHits(opus.body)}`)

    const refCount = (body) => {
        const text = JSON.stringify(body?.rounds || [])
        const refs = text.match(/\b(Exodus|Genesis|Leviticus|Numbers|Deuteronomy|Psalms?|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Ezekiel|Daniel|1 Samuel|2 Samuel|1 Kings|2 Kings|Joshua|Judges|Ruth)\s+\d+/g)
        return refs ? new Set(refs).size : 0
    }
    console.log(`  unique OT refs in rounds:  sonnet ${refCount(sonnet.body)}  opus ${refCount(opus.body)}`)
    console.log()
}

console.log('Raw outputs saved to lesson-database/opus-test/ — open side-by-side to hand-diff prompts and content quality.')
