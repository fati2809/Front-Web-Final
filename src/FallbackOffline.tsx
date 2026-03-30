import { useState } from "react";

function OfflineFallback({ children }: { children: React.ReactNode }) {
    const [blockedOnMount] = useState(() => {
        if (typeof window === "undefined") return false;
        return !navigator.onLine;
    });

    if (!blockedOnMount) return <>{children}</>;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "#0f172a",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                backgroundColor: "rgba(239,68,68,0.15)",
                border: "2px solid rgba(239,68,68,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" strokeLinecap="round" strokeWidth="3" />
                </svg>
            </div>

            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#f1f5f9" }}>
                    Sin conexión
                </h1>
                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8", maxWidth: "320px", lineHeight: "1.6" }}>
                    No hay conexión a internet. Recarga la página cuando vuelvas a conectarte.
                </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: "13px", color: "#64748b" }}>Esperando conexión...</span>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
        </div>
    );
}

export default OfflineFallback;