"use client";

import { useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState(false);

  async function toggleCamera() {
    if (camera) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamera(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    setCamera(true);
  }

  return (
    <main style={{ minHeight: "100vh", padding: 32, fontFamily: "system-ui" }}>
      <h1>Vivid AI</h1>
      <p>Realtime AI character with camera and voice interaction.</p>
      <button onClick={toggleCamera} style={{ padding: "12px 18px", marginBottom: 20 }}>
        {camera ? "Stop camera" : "Start camera"}
      </button>
      <div style={{ maxWidth: 720, aspectRatio: "16/9", background: "#111", borderRadius: 20, overflow: "hidden" }}>
        <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </main>
  );
}
