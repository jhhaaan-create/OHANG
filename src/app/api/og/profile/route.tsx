import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const ENERGY_COLORS: Record<string, string> = {
  Wood: "#00E676",
  Fire: "#FF3D00",
  Earth: "#FFC400",
  Metal: "#B0BEC5",
  Water: "#448AFF",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const archetype = searchParams.get("archetype") || "THE ENIGMA";
  const element = searchParams.get("element") || "Water";
  const line1 = searchParams.get("line1") || "";
  const line2 = searchParams.get("line2") || "";
  const line3 = searchParams.get("line3") || "";
  const username = searchParams.get("username") || "";

  const color = ENERGY_COLORS[element] || ENERGY_COLORS.Water;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1350,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial gradient top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 400,
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${color}30, transparent)`,
            display: "flex",
          }}
        />

        {/* Username (optional) */}
        {username && (
          <div
            style={{
              position: "absolute",
              top: 80,
              display: "flex",
              fontSize: 20,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {username}
          </div>
        )}

        {/* Archetype Name */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: 3,
            textTransform: "uppercase",
            marginTop: username ? 60 : 0,
          }}
        >
          {archetype.toUpperCase()}
        </div>

        {/* Core Frequency */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 30,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: color,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 24,
              color: color,
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            Core Frequency: {element}
          </div>
        </div>

        {/* Savage Lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 80,
            maxWidth: 800,
          }}
        >
          {[line1, line2, line3].filter(Boolean).map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.6)",
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: 1.5,
                display: "flex",
              }}
            >
              &ldquo;{line}&rdquo;
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.15)",
              letterSpacing: 3,
              display: "flex",
            }}
          >
            ohang.app
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.1)",
              display: "flex",
            }}
          >
            What Energy Are You Missing?
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
    }
  );
}
