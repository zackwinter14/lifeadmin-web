import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Life Admin — Track Bills, Cancel Subscriptions, Save Money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#0a0a0a",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -150, left: -150,
        width: 700, height: 700, borderRadius: "50%",
        background: "rgba(62,167,88,0.12)", filter: "blur(100px)",
      }} />
      <div style={{
        position: "absolute", bottom: -100, right: -100,
        width: 500, height: 500, borderRadius: "50%",
        background: "rgba(62,167,88,0.08)", filter: "blur(80px)",
      }} />

      {/* Logo row */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 52 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, #3EA758, #5bdb77)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, fontWeight: 900, color: "#000",
        }}>$</div>
        <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>Life Admin</span>
        <div style={{
          marginLeft: 8, background: "rgba(62,167,88,0.2)",
          border: "1px solid rgba(62,167,88,0.4)",
          borderRadius: 999, padding: "6px 14px",
          fontSize: 16, color: "#3EA758", fontWeight: 700,
        }}>Free on App Store</div>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 68, fontWeight: 900, color: "#ffffff",
        lineHeight: 1.08, marginBottom: 28, maxWidth: 950,
      }}>
        Stop losing money on{" "}
        <span style={{ color: "#3EA758" }}>forgotten</span>{" "}
        subscriptions.
      </div>

      {/* Subtext */}
      <div style={{ fontSize: 26, color: "#9ca3af", marginBottom: 52, maxWidth: 800 }}>
        Find every recurring charge. Cancel what you don't use. Save $240+/month.
      </div>

      {/* Stat pills */}
      <div style={{ display: "flex", gap: 14 }}>
        {[
          { label: "4.8 stars", sub: "App Store" },
          { label: "$240+/mo", sub: "average saved" },
          { label: "Free forever", sub: "no card needed" },
        ].map(item => (
          <div key={item.label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "14px 24px",
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{item.label}</span>
            <span style={{ fontSize: 14, color: "#6b7280" }}>{item.sub}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  );
}
