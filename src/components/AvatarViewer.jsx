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
          console.log('Found mesh with morph targets:', child.name);
          console.log('Available morph targets:', Object.keys(child.morphTargetDictionary));
          foundMorphTargets[child.uuid] = {
            mesh: child,
            dictionary: child.morphTargetDictionary
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

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    // Head movement animation
    if (headBone) {
      const time = state.clock.elapsedTime;

      // Subtle head movement
      const headX = Math.sin(time * 0.5) * 0.1;
      const headY = Math.cos(time * 0.3) * 0.05;

      headBone.rotation.x = headX;
      headBone.rotation.y = headY;
    }

    // Eye blinking animation
    setBlinkTimer((prev) => prev + delta);

    if (blinkTimer > 2 + Math.random() * 3) {
      // Random blink interval
      setIsBlinking(true);
      setBlinkTimer(0);

      setTimeout(() => {
        setIsBlinking(false);
      }, 150); // Blink duration
    }

    // Apply emotions and blinking to morph targets
    Object.values(morphTargets).forEach(({ mesh, dictionary }) => {
      if (mesh.morphTargetInfluences) {
        // Reset all morph targets first
        mesh.morphTargetInfluences.fill(0);
        
        // Apply current emotion
        if (currentEmotion && currentEmotion !== 'neutral') {
          console.log('Applying emotion:', currentEmotion);
          
          // Ready Player Me emotion mapping
          const emotionMappings = {
            'happy': ['mouthSmile', 'mouthSmileLeft', 'mouthSmileRight', 'cheekSquintLeft', 'cheekSquintRight'],
            'sad': ['mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight'],
            'angry': ['browDownLeft', 'browDownRight', 'mouthPressLeft', 'mouthPressRight', 'noseSneerLeft', 'noseSneerRight'],
            'surprised': ['browInnerUp', 'eyeWideLeft', 'eyeWideRight', 'jawOpen'],
            'disgusted': ['noseSneerLeft', 'noseSneerRight', 'mouthUpperUpLeft', 'mouthUpperUpRight'],
            'fearful': ['browInnerUp', 'eyeWideLeft', 'eyeWideRight', 'mouthStretchLeft', 'mouthStretchRight'],
            'joy': ['mouthSmile', 'cheekSquintLeft', 'cheekSquintRight', 'eyeSquintLeft', 'eyeSquintRight'],
            'excited': ['browInnerUp', 'mouthSmile', 'eyeWideLeft', 'eyeWideRight'],
            'confused': ['browDownLeft', 'browDownRight', 'mouthLeft', 'mouthRight'],
            'wink': ['eyeBlinkLeft'],
            'laugh': ['mouthSmile', 'jawOpen', 'cheekSquintLeft', 'cheekSquintRight'],
            'smirk': ['mouthSmileLeft', 'mouthDimpleLeft'],
            'thinking': ['mouthPucker', 'browDownLeft', 'browDownRight'],
            'love': ['mouthKiss', 'eyeSquintLeft', 'eyeSquintRight'],
            'tired': ['eyeSquintLeft', 'eyeSquintRight', 'mouthFrownLeft', 'mouthFrownRight'],
            'cool': ['eyeSquintLeft', 'eyeSquintRight', 'mouthSmile'],
            'shy': ['eyeSquintLeft', 'eyeSquintRight', 'mouthSmileLeft', 'mouthSmileRight'],
            'crazy': ['eyeWideLeft', 'eyeWideRight', 'mouthSmile', 'tongueOut']
          };
          
          const targetMorphs = emotionMappings[currentEmotion] || [];
          
          Object.keys(dictionary).forEach((key) => {
            const index = dictionary[key];
            
            // Check if this morph target matches our emotion
            const shouldActivate = targetMorphs.some(target => 
              key.toLowerCase().includes(target.toLowerCase()) ||
              target.toLowerCase().includes(key.toLowerCase())
            );
            
            if (shouldActivate && mesh.morphTargetInfluences[index] !== undefined) {
              mesh.morphTargetInfluences[index] = 0.8; // Slightly less than full intensity
              console.log('Activated morph target:', key, 'for emotion:', currentEmotion);
            }
          });
        }
        
        // Apply blinking (override emotion for blink targets)
        Object.keys(dictionary).forEach((key) => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes("blink") || lowerKey.includes("eye_close") || lowerKey.includes("eyeblink")) {
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
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <h4>Available Morph Targets:</h4>
          <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {availableMorphs.map((morph, index) => (
              <span key={index} style={{ 
                backgroundColor: '#007bff', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '3px' 
              }}>
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
