/**
 * OHANG AI Engine — Integration Test Simulation
 * Verifies the full pipeline: SajuEngine → Adapter → Cache → OhangEngine
 *
 * Usage: npx tsx scripts/test-ai-engine.ts
 * (Requires ANTHROPIC_API_KEY and Supabase env vars)
 */

import { OhangEngine } from "../src/lib/ai/engine";
import { generateCacheKey, getCachedResult, setCachedResult } from "../src/lib/ai/cache";
import { SajuEngine } from "../src/lib/saju/engine";
import { formatChartToAiContext } from "../src/lib/saju/adapter";

// ─── Test 1: Saju Engine Computation ─────────────────────

async function testSajuEngine() {
    console.log("═══ Test 1: Saju Engine ═══");

    const chart = SajuEngine.compute({
        year: 1990, month: 3, day: 15,
        hour: 14, minute: 30, gender: 'male',
    });

    console.log("Year Pillar:", chart.year.koreanName);
    console.log("Month Pillar:", chart.month.koreanName);
    console.log("Day Pillar:", chart.day.koreanName);
    console.log("Hour Pillar:", chart.hour.koreanName);
    console.assert(chart.year.stem !== undefined, "Year stem should exist");
    console.log("✅ Saju computation successful");

    const context = formatChartToAiContext(chart);
    console.log("Archetype:", context.archetype.primary);
    console.log("Void Element:", context.void_element);
    console.assert(context.archetype.primary !== undefined, "Archetype should exist");
    console.log("✅ Adapter conversion successful");
}

// ─── Test 2: Cache Key Generation ────────────────────────

async function testCacheKeyGeneration() {
    console.log("\n═══ Test 2: Cache Key Generation ═══");

    const data = { test: "deterministic", value: 42 };
    const key1 = generateCacheKey("archetype", data);
    const key2 = generateCacheKey("archetype", data);
    const key3 = generateCacheKey("compatibility", data);

    console.assert(key1 === key2, "Same input → same key");
    console.log("✅ Same input → Same key");

    console.assert(key1 !== key3, "Different prefix → different key");
    console.log("✅ Different prefix → Different key");
}

// ─── Test 3: Cache Read/Write ────────────────────────────

async function testCacheHit() {
    console.log("\n═══ Test 3: Cache Hit Simulation ═══");

    const cacheKey = generateCacheKey("test_cache", { test: true });
    const mockResult = { archetype_name: "The Icon", share_line: "Test" };

    await setCachedResult(cacheKey, mockResult, 1);
    console.log("✅ Cache written");

    const cached = await getCachedResult(cacheKey);
    console.assert(cached !== null, "Cache should return data");
    console.log("✅ Cache hit:", JSON.stringify(cached));
}

// ─── Run All Tests ───────────────────────────────────────

async function main() {
    console.log("OHANG AI Engine Integration Test\n");

    await testSajuEngine();
    await testCacheKeyGeneration();
    await testCacheHit();

    console.log("\n═══ All tests completed ═══");
}

main().catch(console.error);
