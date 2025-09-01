import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Suspense, useRef, useEffect, useState } from "react";
import * as THREE from "three";

const AvatarModel = ({ url, currentEmotion, onMorphTargetsFound }) => {
  const gltf = useLoader(GLTFLoader, url);
  const avatarRef = useRef();
  const [mixer, setMixer] = useState(null);
  const [headBone, setHeadBone] = useState(null);
  const [eyeBones, setEyeBones] = useState({ left: null, right: null });
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [morphTargets, setMorphTargets] = useState({});

  // Smooth transition system
  const currentEmotionValues = useRef({});
  const targetEmotionValues = useRef({});
  const previousEmotion = useRef(currentEmotion);
  const transitionProgress = useRef(0);
  const transitionDuration = 0.8; // seconds for smooth transition

  useEffect(() => {
    if (gltf.scene) {
      const foundMorphTargets = {};

      // Find head and eye bones, and collect morph targets
      gltf.scene.traverse((child) => {
        if (child.isBone) {
          if (
            child.name.toLowerCase().includes("head") ||
            child.name.toLowerCase().includes("neck")
          ) {
            setHeadBone(child);
          }
          if (child.name.toLowerCase().includes("eye")) {
            if (child.name.toLowerCase().includes("left")) {
              setEyeBones((prev) => ({ ...prev, left: child }));
            } else if (child.name.toLowerCase().includes("right")) {
              setEyeBones((prev) => ({ ...prev, right: child }));
            }
          }
        }

        // Collect morph targets for emotions
        if (child.isMesh && child.morphTargetDictionary) {
          foundMorphTargets[child.uuid] = {
            mesh: child,
            dictionary: child.morphTargetDictionary,
          };
        }
      });

      setMorphTargets(foundMorphTargets);

      // Notify parent component about available morph targets
      if (onMorphTargetsFound) {
        onMorphTargetsFound(foundMorphTargets);
      }

      // Setup animation mixer if animations exist
      if (gltf.animations && gltf.animations.length > 0) {
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        setMixer(animationMixer);
      }
    }
  }, [gltf, onMorphTargetsFound]);

  // Helper function for linear interpolation
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  // Helper function to get emotion intensity values
  const getEmotionIntensities = (emotion) => {
    const emotionMappings = {
      happy: [
        "mouthSmile",
        "mouthSmileLeft",
        "mouthSmileRight",
        "cheekSquintLeft",
        "cheekSquintRight",
      ],
      sad: [
        "mouthFrownLeft",
        "mouthFrownRight",
        "browDownLeft",
        "browDownRight",
      ],
      angry: [
        "browDownLeft",
        "browDownRight",
        "mouthPressLeft",
        "mouthPressRight",
        "noseSneerLeft",
        "noseSneerRight",
      ],
      surprised: ["browInnerUp", "eyeWideLeft", "eyeWideRight", "jawOpen"],
      disgusted: [
        "noseSneerLeft",
        "noseSneerRight",
        "mouthUpperUpLeft",
        "mouthUpperUpRight",
      ],
      fearful: [
        "browInnerUp",
        "eyeWideLeft",
        "eyeWideRight",
        "mouthStretchLeft",
        "mouthStretchRight",
      ],
      joy: [
        "mouthSmile",
        "cheekSquintLeft",
        "cheekSquintRight",
        "eyeSquintLeft",
        "eyeSquintRight",
      ],
      excited: ["browInnerUp", "mouthSmile", "eyeWideLeft", "eyeWideRight"],
      confused: ["browDownLeft", "browDownRight", "mouthLeft", "mouthRight"],
      wink: ["eyeBlinkLeft"],
      laugh: ["mouthSmile", "jawOpen", "cheekSquintLeft", "cheekSquintRight"],
      smirk: ["mouthSmileLeft", "mouthDimpleLeft"],
      thinking: ["mouthPucker", "browDownLeft", "browDownRight"],
      love: ["mouthKiss", "eyeSquintLeft", "eyeSquintRight"],
      tired: [
        "eyeSquintLeft",
        "eyeSquintRight",
        "mouthFrownLeft",
        "mouthFrownRight",
      ],
      cool: ["eyeSquintLeft", "eyeSquintRight", "mouthSmile"],
      shy: [
        "eyeSquintLeft",
        "eyeSquintRight",
        "mouthSmileLeft",
        "mouthSmileRight",
      ],
      crazy: ["eyeWideLeft", "eyeWideRight", "mouthSmile", "tongueOut"],
      contempt: ["mouthSmileLeft", "noseSneerLeft"],
    };

    // Custom intensity values for more natural expressions
    const emotionIntensities = {
      happy: 0.15,
      sad: 0.2,
      angry: 0.25,
      surprised: 0.3,
      disgusted: 0.2,
      fearful: 0.25,
      joy: 0.18,
      excited: 0.28,
      confused: 0.15,
      wink: 0.8,
      laugh: 0.22,
      smirk: 0.25,
      thinking: 0.18,
      love: 0.2,
      tired: 0.15,
      cool: 0.2,
      shy: 0.12,
      crazy: 0.35,
      contempt: 0.2,
    };

    const targetMorphs = emotionMappings[emotion] || [];
    const intensity = emotionIntensities[emotion] || 0.2;

    return { targetMorphs, intensity };
  };

  // Check if emotion changed and start transition
  useEffect(() => {
    if (previousEmotion.current !== currentEmotion) {
      // Start new transition
      transitionProgress.current = 0;

      // Set target emotion values
      if (currentEmotion === "neutral") {
        targetEmotionValues.current = {};
      } else {
        const { targetMorphs, intensity } =
          getEmotionIntensities(currentEmotion);
        targetEmotionValues.current = { targetMorphs, intensity };
      }

      previousEmotion.current = currentEmotion;
    }
  }, [currentEmotion]);

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    // Head movement animation
    if (headBone) {
      const time = state.clock.elapsedTime;
      const headX = Math.sin(time * 0.5) * 0.1;
      const headY = Math.cos(time * 0.3) * 0.05;
      headBone.rotation.x = headX;
      headBone.rotation.y = headY;
    }

    // Eye blinking animation
    setBlinkTimer((prev) => prev + delta);

    if (blinkTimer > 2 + Math.random() * 3) {
      setIsBlinking(true);
      setBlinkTimer(0);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
    }

    // Update transition progress
    if (transitionProgress.current < 1) {
      transitionProgress.current = Math.min(
        1,
        transitionProgress.current + delta / transitionDuration
      );
    }

    // Apply smooth emotion transitions to morph targets
    Object.values(morphTargets).forEach(({ mesh, dictionary }) => {
      if (mesh.morphTargetInfluences) {
        // Reset all morph targets first
        mesh.morphTargetInfluences.fill(0);

        // Apply smooth emotion transition
        if (targetEmotionValues.current.targetMorphs) {
          const { targetMorphs, intensity } = targetEmotionValues.current;
          const progress = transitionProgress.current;

          // Use easing function for smoother transitions
          const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

          Object.keys(dictionary).forEach((key) => {
            const index = dictionary[key];

            // Check if this morph target matches our emotion
            const shouldActivate = targetMorphs.some(
              (target) =>
                key.toLowerCase().includes(target.toLowerCase()) ||
                target.toLowerCase().includes(key.toLowerCase())
            );

            if (
              shouldActivate &&
              mesh.morphTargetInfluences[index] !== undefined
            ) {
              // Get current value (from previous frame)
              const currentValue = currentEmotionValues.current[key] || 0;

              // Interpolate to target intensity
              const targetValue = intensity;
              const newValue = lerp(currentValue, targetValue, easedProgress);

              mesh.morphTargetInfluences[index] = newValue;
              currentEmotionValues.current[key] = newValue;
            } else {
              // Fade out non-active morph targets
              const currentValue = currentEmotionValues.current[key] || 0;
              if (currentValue > 0) {
                const newValue = lerp(currentValue, 0, easedProgress);
                if (mesh.morphTargetInfluences[index] !== undefined) {
                  mesh.morphTargetInfluences[index] = newValue;
                }
                currentEmotionValues.current[key] = newValue;
              }
            }
          });
        } else {
          // Transitioning to neutral - fade out all emotions
          const progress = transitionProgress.current;
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          Object.keys(dictionary).forEach((key) => {
            const index = dictionary[key];
            const currentValue = currentEmotionValues.current[key] || 0;

            if (currentValue > 0) {
              const newValue = lerp(currentValue, 0, easedProgress);
              if (mesh.morphTargetInfluences[index] !== undefined) {
                mesh.morphTargetInfluences[index] = newValue;
              }
              currentEmotionValues.current[key] = newValue;
            }
          });
        }

        // Apply blinking (override emotion for blink targets)
        Object.keys(dictionary).forEach((key) => {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes("blink") ||
            lowerKey.includes("eye_close") ||
            lowerKey.includes("eyeblink")
          ) {
            const index = dictionary[key];
            if (mesh.morphTargetInfluences[index] !== undefined) {
              mesh.morphTargetInfluences[index] = isBlinking ? 1 : 0;
            }
          }
        });
      }
    });

    // Eye movement (looking around)
    if (eyeBones.left && eyeBones.right) {
      const time = state.clock.elapsedTime;
      const eyeX = Math.sin(time * 0.8) * 0.2;
      const eyeY = Math.cos(time * 0.6) * 0.1;
      eyeBones.left.rotation.x = eyeY;
      eyeBones.left.rotation.y = eyeX;
      eyeBones.right.rotation.x = eyeY;
      eyeBones.right.rotation.y = eyeX;
    }
  });

  return (
    <primitive
      ref={avatarRef}
      object={gltf.scene}
      scale={2}
      position={[0, -1.5, 0]}
    />
  );
};

const AvatarViewer = ({ avatarUrl, currentEmotion, showDebug }) => {
  const [availableMorphs, setAvailableMorphs] = useState([]);

  const handleMorphTargetsFound = (morphs) => {
    const allMorphs = [];
    Object.values(morphs).forEach(({ dictionary }) => {
      allMorphs.push(...Object.keys(dictionary));
    });
    setAvailableMorphs([...new Set(allMorphs)]);
  };

  return (
    <div>
      <div style={{ width: "100%", height: "500px" }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense
            fallback={
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="gray" />
              </mesh>
            }
          >
            <Environment preset="apartment" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            {avatarUrl && (
              <AvatarModel
                url={avatarUrl}
                currentEmotion={currentEmotion}
                onMorphTargetsFound={handleMorphTargetsFound}
              />
            )}
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={3}
              maxDistance={8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>
      </div>

      {showDebug && availableMorphs.length > 0 && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f0f0f0",
            borderRadius: "5px",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <h4>Available Morph Targets:</h4>
          <div
            style={{
              fontSize: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
            }}
          >
            {availableMorphs.map((morph, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                {morph}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarViewer;
