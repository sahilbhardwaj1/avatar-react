import { useState } from "react";
import AvatarViewer from "./components/AvatarViewer";
import "./App.css";

function App() {
  const avatarUrl =
    "https://models.readyplayer.me/68b586e26b7c5bd83d977df4.glb";
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [showDebug, setShowDebug] = useState(true);

  const emotions = [
    { name: "neutral", emoji: "😐", color: "#6c757d" },
    { name: "happy", emoji: "😊", color: "#28a745" },
    { name: "sad", emoji: "😢", color: "#007bff" },
    { name: "angry", emoji: "😠", color: "#dc3545" },
    { name: "surprised", emoji: "😲", color: "#ffc107" },
    { name: "disgusted", emoji: "🤢", color: "#6f42c1" },
    { name: "fearful", emoji: "😨", color: "#fd7e14" },
    { name: "contempt", emoji: "😤", color: "#20c997" },
    { name: "joy", emoji: "😄", color: "#ffeb3b" },
    { name: "excited", emoji: "🤩", color: "#e91e63" },
    { name: "confused", emoji: "😕", color: "#795548" },
    { name: "tired", emoji: "😴", color: "#607d8b" },
    { name: "love", emoji: "😍", color: "#f44336" },
    { name: "wink", emoji: "😉", color: "#9c27b0" },
    { name: "laugh", emoji: "😂", color: "#4caf50" },
    { name: "smirk", emoji: "😏", color: "#ff5722" },
    { name: "thinking", emoji: "🤔", color: "#3f51b5" },
    { name: "cool", emoji: "😎", color: "#009688" },
    { name: "shy", emoji: "😳", color: "#ffb74d" },
    { name: "crazy", emoji: "🤪", color: "#ab47bc" },
  ];

  const handleEmotionClick = (emotion) => {
    setCurrentEmotion(emotion);
    // Auto-reset to neutral after 3 seconds
    setTimeout(() => {
      setCurrentEmotion("neutral");
    }, 3000);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Ready Player Me Integration with Emotions</h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "600px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>3D Avatar Viewer</h2>
            <button
              onClick={() => setShowDebug(!showDebug)}
              style={{
                padding: "5px 10px",
                backgroundColor: showDebug ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
          </div>
          <AvatarViewer
            avatarUrl={avatarUrl}
            currentEmotion={currentEmotion}
            showDebug={showDebug}
          />
          <p
            style={{
              marginTop: "10px",
              fontSize: "14px",
              color: "#666",
              textAlign: "center",
            }}
          >
            Use mouse to rotate, scroll to zoom • Current emotion:{" "}
            <strong>{currentEmotion}</strong>
          </p>
        </div>

        <div style={{ flex: "0 0 300px" }}>
          <h2>Emotion Controls</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
              maxHeight: "500px",
              overflowY: "auto",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            {emotions.map((emotion) => (
              <button
                key={emotion.name}
                onClick={() => handleEmotionClick(emotion.name)}
                style={{
                  padding: "12px 8px",
                  border:
                    currentEmotion === emotion.name
                      ? "3px solid #000"
                      : "2px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor:
                    currentEmotion === emotion.name ? emotion.color : "#fff",
                  color: currentEmotion === emotion.name ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s ease",
                  minHeight: "70px",
                }}
                onMouseEnter={(e) => {
                  if (currentEmotion !== emotion.name) {
                    e.target.style.backgroundColor = emotion.color;
                    e.target.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentEmotion !== emotion.name) {
                    e.target.style.backgroundColor = "#fff";
                    e.target.style.color = "#333";
                  }
                }}
              >
                <span style={{ fontSize: "20px" }}>{emotion.emoji}</span>
                <span>{emotion.name}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            Click any emotion button to see the avatar's expression change.
            Emotions auto-reset to neutral after 3 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
