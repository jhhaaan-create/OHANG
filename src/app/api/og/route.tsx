import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

// ── Element Design System ────────────────────────────────
const ELEMENTS: Record<
  string,
  { bg: string; accent: string; text: string; glow: string; icon: string; labelKo: string }
> = {
  Wood:  { bg: "#052e16", accent: "#22c55e", text: "#bbf7d0", glow: "rgba(34,197,94,0.3)",  icon: "\u{1F33F}",                  labelKo: "\u{6728}" },
  Fire:  { bg: "#431407", accent: "#f97316", text: "#fed7aa", glow: "rgba(249,115,22,0.3)",  icon: "\u{1F525}",                  labelKo: "\u{706B}" },
  Earth: { bg: "#422006", accent: "#eab308", text: "#fef08a", glow: "rgba(234,179,8,0.25)",  icon: "\u{1F3D4}\u{FE0F}",         labelKo: "\u{571F}" },
  Metal: { bg: "#18181b", accent: "#a1a1aa", text: "#e4e4e7", glow: "rgba(161,161,170,0.25)", icon: "\u{2694}\u{FE0F}",         labelKo: "\u{91D1}" },
  Water: { bg: "#172554", accent: "#3b82f6", text: "#bfdbfe", glow: "rgba(59,130,246,0.3)",  icon: "\u{1F30A}",                  labelKo: "\u{6C34}" },
};

const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;

// i18n via Accept-Language header
function detectLang(req: NextRequest): "ko" | "en" {
  const h = req.headers.get("accept-language") ?? "";
  return h.includes("ko") ? "ko" : "en";
}

function t(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        cta: "ohang.app\uC5D0\uC11C \uB098\uC758 \uC6B4\uBA85 \uD655\uC778 \u2192",
        voidLabel: "\uBD80\uC871 \uC6D0\uC18C",
        chemLabel: "\uAD81\uD569 \uC810\uC218",
        brandSub: "\uC624\uD589 \u00B7 \uC6B4\uBA85 \uBD84\uC11D",
        profileSub: "\uB2F9\uC2E0\uC758 \uC228\uACA8\uC9C4 \uC57D\uC810\uC740\u2026",
      }
    : {
        cta: "Discover yours at ohang.app \u2192",
        voidLabel: "Missing Element",
        chemLabel: "Chemistry Score",
        brandSub: "Five Element Intelligence",
        profileSub: "Your hidden weakness is\u2026",
      };
}

// ══════════════════════════════════════════════════════════
// GET handler — 3 modes: default / profile / chemistry
// ══════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = detectLang(request);
  const text = t(lang);

  const mode = searchParams.get("mode") ?? "profile";
  const archetype = searchParams.get("archetype") ?? "The Enigma";
  const element = searchParams.get("element") ?? "Water";
  const voidElement = searchParams.get("void") ?? "";
  const name = searchParams.get("name") ?? "";
  const score = searchParams.get("score");
  const partner = searchParams.get("partner");
  const balanceStr = searchParams.get("balance"); // e.g. "3,5,2,1,4"
  const balance = balanceStr ? balanceStr.split(",").map(Number) : [2, 3, 2, 2, 3];

  const el = ELEMENTS[element] ?? ELEMENTS.Water;

  // ── DEFAULT MODE ─────────────────────────────────────
  if (mode === "default") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, #a78bfa12, transparent 70%)" }} />
          <span style={{ fontSize: 56, fontWeight: 800, color: "#ffffff", letterSpacing: 16, marginBottom: 16 }}>OHANG</span>
          <span style={{ fontSize: 20, color: "#ffffff50" }}>{text.brandSub}</span>
          <span style={{ fontSize: 14, color: "#ffffff25", marginTop: 32 }}>518,400 unique soul blueprints</span>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  // ── CHEMISTRY MODE ───────────────────────────────────
  if (mode === "chemistry" && score && partner) {
    const pElKey = searchParams.get("partnerElement") ?? element;
    const pEl = ELEMENTS[pElKey] ?? ELEMENTS.Water;
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", fontFamily: "system-ui, sans-serif", position: "relative" }}>
          {/* dual glow */}
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${el.glow}, transparent 70%)`, left: "20%", top: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${pEl.glow}, transparent 70%)`, left: "80%", top: "50%", transform: "translate(-50%,-50%)" }} />

          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 160, height: 160, borderRadius: "50%", border: `3px solid ${el.accent}60`, marginBottom: 28 }}>
            <span style={{ fontSize: 72, fontWeight: 800, color: el.accent, lineHeight: 1 }}>{score}</span>
          </div>

          {/* Pair */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: el.accent }}>{el.icon}</span>
              <span style={{ fontSize: 22, color: el.text, fontWeight: 600 }}>{archetype}</span>
            </div>
            <span style={{ fontSize: 24, color: "#ffffff20" }}>{"\u00D7"}</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: pEl.accent }}>{pEl.icon}</span>
              <span style={{ fontSize: 22, color: pEl.text, fontWeight: 600 }}>{partner}</span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "#ffffff40", letterSpacing: 2, textTransform: "uppercase", marginBottom: 36 }}>{text.chemLabel}</span>

          {/* Dimension bars */}
          {searchParams.get("passion") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 320, marginBottom: 24 }}>
              {(["Passion", "Stability", "Growth"] as const).map((dim) => {
                const val = parseInt(searchParams.get(dim.toLowerCase()) ?? "75", 10);
                return (
                  <div key={dim} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                    <span style={{ fontSize: 10, color: "#ffffff40", width: 60 }}>{dim.toUpperCase()}</span>
                    <div style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${val}%`, height: "100%", backgroundColor: el.accent, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#ffffff30", width: 20, textAlign: "right" }}>{val}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Brand */}
          <div style={{ position: "absolute", bottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff20", letterSpacing: 6 }}>OHANG</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  // ── PROFILE MODE (God-Tier) ──────────────────────────
  const maxBal = Math.max(...balance, 1);
  const voidEl = ELEMENTS[voidElement] ?? null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: el.bg, fontFamily: "system-ui, sans-serif", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${el.glow}, transparent 70%)`, top: "30%", left: "30%", transform: "translate(-50%,-50%)" }} />

        {/* LEFT: Identity */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 50px", position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#ffffff30", letterSpacing: 6 }}>OHANG</span>
            <span style={{ fontSize: 11, color: "#ffffff15" }}>{text.brandSub}</span>
          </div>

          {/* Element badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, border: `1px solid ${el.accent}30`, backgroundColor: `${el.accent}08`, marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>{el.icon}</span>
            <span style={{ fontSize: 13, color: el.accent, fontWeight: 600, letterSpacing: 1 }}>{element} Element</span>
          </div>

          {/* Archetype */}
          <span style={{ fontSize: 52, fontWeight: 800, color: "#ffffff", lineHeight: 1.1, marginBottom: 12, textShadow: `0 0 60px ${el.glow}` }}>{archetype}</span>

          {/* Sub */}
          <span style={{ fontSize: 16, color: "#ffffff50", marginBottom: 24, fontStyle: "italic" }}>{name ? `${name}'s Soul Blueprint` : text.profileSub}</span>

          {/* Void */}
          {voidEl && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 10, color: "#ffffff30" }}>{text.voidLabel}:</span>
              <span style={{ fontSize: 13, color: voidEl.accent, fontWeight: 600 }}>{voidEl.icon} {voidElement}</span>
            </div>
          )}

          {/* CTA */}
          <span style={{ fontSize: 12, color: "#ffffff25", marginTop: 36 }}>{text.cta}</span>
        </div>

        {/* RIGHT: 5-Element Bar Chart */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 40px 60px 0", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 10, color: "#ffffff30", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Element Balance</span>
            {ELEMENT_ORDER.map((elName, i) => {
              const isActive = elName === element;
              const info = ELEMENTS[elName];
              const val = balance[i] ?? 2;
              const pct = Math.min(100, (val / maxBal) * 100);
              return (
                <div key={elName} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: 12, color: "#ffffff60", width: 20 }}>{info.labelKo}</span>
                  <div style={{ flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: isActive ? info.accent : "#ffffff20", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#ffffff40", width: 16, textAlign: "right" }}>{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
