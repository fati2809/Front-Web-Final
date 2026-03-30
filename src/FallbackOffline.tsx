import { useState } from "react";

function OfflineFallback({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  useState(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
  });

  return (
    <>
      {children}

      {!isOnline && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          backgroundColor: "#dc2626",
          color: "#fff",
          borderRadius: "12px",
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 24px rgba(220,38,38,0.35)",
          fontSize: "14px", fontWeight: 500,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          animation: "slideIn 0.3s ease",
          maxWidth: "320px",
        }}>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Icono */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ flexShrink: 0 }}>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" strokeLinecap="round" strokeWidth="3" />
          </svg>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "2px" }}>Sin conexión</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              Los cambios se guardarán al reconectarte.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OfflineFallback;