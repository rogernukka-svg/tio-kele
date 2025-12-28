"use client";
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [pct, setPct] = useState(1);

  // ================= MATRIX =================
  useEffect(() => {
    const canvas = document.getElementById("matrix") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resizeMatrix() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeMatrix();
    window.addEventListener("resize", resizeMatrix);

    const letters = "TIO KELE";
    const fontSize = 18;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array(columns).fill(1);

    function drawMatrix() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#6bff6b";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(drawMatrix, 40);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeMatrix);
    };
  }, []);

  // ================= PORCENTAJE =================
  useEffect(() => {
    const t = setInterval(() => {
      setPct((old) => {
        let n = old + Math.floor(Math.random() * 6) + 2;
        if (n >= 300) {
          clearInterval(t);
          setTimeout(() => onFinish(), 1000);
          return 300;
        }
        return n;
      });
    }, 110);

    return () => clearInterval(t);
  }, [onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "black",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <canvas
        id="matrix"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      ></canvas>

      <div
        id="percentText"
        style={{
          position: "absolute",
          bottom: "15%",
          fontSize: 36,
          fontWeight: 900,
          color: "#ffdb4d",
          textShadow:
            "0 0 10px #ffdb4d, 0 0 22px #ffaf00, 0 0 30px #ff9000",
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
