"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ImageWithFullscreen({ src, alt, width = 600 }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen state
  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Close fullscreen if user presses Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        handleExitFullscreen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  return (
    <>
      {/* Normal Image */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <img src={src} alt={alt} width={width} style={{ display: "block", cursor: "pointer" }} />
        <button
          onClick={handleFullscreen}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "6px 10px",
            border: "none",
            borderRadius: 8,
            background: "black",
            color: "white",
            cursor: "pointer",
          }}
        >
          <Maximize2 />
        </button>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          onClick={handleExitFullscreen} // clicking outside image exits fullscreen
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              boxShadow: "0 0 20px rgba(255,255,255,0.5)",
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent closing when clicking button
              handleExitFullscreen();
            }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              padding: "8px 12px",
              border: "none",
              borderRadius: 8,
              background: "white",
              color: "black",
              cursor: "pointer",
              zIndex: 10000,
            }}
          >
            <Minimize2 />
          </button>
        </div>
      )}
    </>
  );
}
