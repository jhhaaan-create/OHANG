import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// ═══════════════════════════════════════════════════════
// OHANG Chemistry Card — Instagram-Ready 1200×1200
//
// GET /api/og/chemistry?
//   archetypeA=The+Maverick&elementA=Metal
//   &archetypeB=The+Healer&elementB=Water
//   &score=87&label=Soulmate+Frequency
//   &passion=92&stability=65&communication=78&growth=88&timing=71
//   &nameA=Josh&nameB=Mina
//   &premium=true  (removes watermark)
//
// Viral Loop:
//   Free  → OHANG watermark overlay (brand awareness)
//   Premium → Clean card (reward for paying)
// ═══════════════════════════════════════════════════════

const ELEMENTS: Record<string, {
    accent: string; text: string; glow: string; icon: string; bg: string;
}> = {
    Wood:  { accent: "#22c55e", text: "#bbf7d0", glow: "rgba(34,197,94,0.35)",  icon: "🌿", bg: "#052e16" },
    Fire:  { accent: "#f97316", text: "#fed7aa", glow: "rgba(249,115,22,0.35)",  icon: "🔥", bg: "#431407" },
    Earth: { accent: "#eab308", text: "#fef08a", glow: "rgba(234,179,8,0.30)",   icon: "🏔️", bg: "#422006" },
    Metal: { accent: "#a1a1aa", text: "#e4e4e7", glow: "rgba(161,161,170,0.30)", icon: "⚔️", bg: "#18181b" },
    Water: { accent: "#3b82f6", text: "#bfdbfe", glow: "rgba(59,130,246,0.35)",  icon: "🌊", bg: "#172554" },
};

function blendColors(hexA: string, hexB: string): string {
    const parse = (h: string) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
    ];
    const a = parse(hexA);
    const b = parse(hexB);
    return `#${a.map((v, i) => Math.round((v + b[i]) / 2).toString(16).padStart(2, '0')).join('')}`;
}

export async function GET(request: NextRequest) {
    const p = request.nextUrl.searchParams;

    const archetypeA = p.get("archetypeA") ?? "The Enigma";
    const archetypeB = p.get("archetypeB") ?? "The Healer";
    const elementA = p.get("elementA") ?? "Water";
    const elementB = p.get("elementB") ?? "Wood";
    const score = p.get("score") ?? "75";
    const label = p.get("label") ?? "Cosmic Chemistry";
    const nameA = p.get("nameA") ?? "";
    const nameB = p.get("nameB") ?? "";
    const isPremium = p.get("premium") === "true";

    const elA = ELEMENTS[elementA] ?? ELEMENTS.Water;
    const elB = ELEMENTS[elementB] ?? ELEMENTS.Wood;

    // Dimension scores
    const dims = [
        { key: "Passion",       val: parseInt(p.get("passion") ?? "75", 10) },
        { key: "Stability",     val: parseInt(p.get("stability") ?? "70", 10) },
        { key: "Communication", val: parseInt(p.get("communication") ?? "72", 10) },
        { key: "Growth",        val: parseInt(p.get("growth") ?? "68", 10) },
        { key: "Timing",        val: parseInt(p.get("timing") ?? "65", 10) },
    ];

    const scoreNum = parseInt(score, 10);
    const blendedAccent = blendColors(elA.accent, elB.accent);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0a",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* ── Background Glow Orbs ── */}
                <div
                    style={{
                        position: "absolute",
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${elA.glow}, transparent 70%)`,
                        left: "10%",
                        top: "15%",
                        transform: "translate(-50%, -50%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${elB.glow}, transparent 70%)`,
                        right: "10%",
                        bottom: "15%",
                        transform: "translate(50%, 50%)",
                    }}
                />

                {/* ── Brand Header ── */}
                <div
                    style={{
                        position: "absolute",
                        top: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff20", letterSpacing: 8 }}>
                        OHANG
                    </span>
                    <span style={{ fontSize: 12, color: "#ffffff10" }}>
                        Five Element Intelligence
                    </span>
                </div>

                {/* ── Chemistry Label ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 20px",
                        borderRadius: 100,
                        border: `1px solid ${blendedAccent}30`,
                        backgroundColor: `${blendedAccent}08`,
                        marginBottom: 24,
                    }}
                >
                    <span style={{ fontSize: 13, color: blendedAccent, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const }}>
                        {label}
                    </span>
                </div>

                {/* ── Score Circle ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        border: `4px solid ${blendedAccent}50`,
                        backgroundColor: `${blendedAccent}08`,
                        marginBottom: 28,
                        position: "relative",
                    }}
                >
                    <span
                        style={{
                            fontSize: 96,
                            fontWeight: 900,
                            color: blendedAccent,
                            lineHeight: 1,
                        }}
                    >
                        {score}
                    </span>
                </div>

                {/* ── Person A × Person B ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 32,
                        marginBottom: 32,
                    }}
                >
                    {/* Person A */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                backgroundColor: `${elA.accent}15`,
                                border: `2px solid ${elA.accent}30`,
                            }}
                        >
                            <span style={{ fontSize: 28 }}>{elA.icon}</span>
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 700, color: elA.text }}>{archetypeA}</span>
                        {nameA && (
                            <span style={{ fontSize: 13, color: "#ffffff40" }}>{nameA}</span>
                        )}
                        <span style={{ fontSize: 11, color: elA.accent, fontWeight: 600 }}>{elementA}</span>
                    </div>

                    {/* Connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 32, color: "#ffffff15" }}>×</span>
                    </div>

                    {/* Person B */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                backgroundColor: `${elB.accent}15`,
                                border: `2px solid ${elB.accent}30`,
                            }}
                        >
                            <span style={{ fontSize: 28 }}>{elB.icon}</span>
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 700, color: elB.text }}>{archetypeB}</span>
                        {nameB && (
                            <span style={{ fontSize: 13, color: "#ffffff40" }}>{nameB}</span>
                        )}
                        <span style={{ fontSize: 11, color: elB.accent, fontWeight: 600 }}>{elementB}</span>
                    </div>
                </div>

                {/* ── Dimension Bars ── */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        width: 500,
                        padding: 24,
                        borderRadius: 16,
                        backgroundColor: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                    {dims.map((dim) => (
                        <div
                            key={dim.key}
                            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}
                        >
                            <span style={{ fontSize: 11, color: "#ffffff40", width: 100, textAlign: "right" }}>
                                {dim.key.toUpperCase()}
                            </span>
                            <div
                                style={{
                                    flex: 1,
                                    height: 10,
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    borderRadius: 5,
                                    overflow: "hidden",
                                    display: "flex",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${dim.val}%`,
                                        height: "100%",
                                        background: `linear-gradient(90deg, ${elA.accent}, ${elB.accent})`,
                                        borderRadius: 5,
                                    }}
                                />
                            </div>
                            <span style={{ fontSize: 12, color: "#ffffff30", width: 28, textAlign: "right", fontWeight: 600 }}>
                                {dim.val}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── CTA / Footer ── */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 36,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <span style={{ fontSize: 14, color: "#ffffff20" }}>
                        Discover yours at ohang.app →
                    </span>
                </div>

                {/* ── Free Tier Watermark (viral branding) ── */}
                {!isPremium && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 48,
                            background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            paddingBottom: 10,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                color: "#ffffff30",
                                letterSpacing: 3,
                                fontWeight: 600,
                            }}
                        >
                            CHECK YOUR CHEMISTRY → OHANG.APP
                        </span>
                    </div>
                )}
            </div>
        ),
        { width: 1200, height: 1200 },
    );
}
