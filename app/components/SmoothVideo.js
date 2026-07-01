"use client"; // Important: must be a Client Component

export default function SmoothVideo({ src, poster }) {
  return (
    <div style={{ maxWidth: "800px", margin: "auto", textAlign: "center" }}>
      <video
        src={src}
        poster={poster}
        controls
        autoPlay={false}
        loop
        muted={false}
        playsInline
        style={{
          width: "100%",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}
