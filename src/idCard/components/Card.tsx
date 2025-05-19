import * as THREE from "three";
import { RenderTexture, useGLTF, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { BallCollider, CuboidCollider, RigidBody, useRopeJoint, useSphericalJoint } from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { GLTF, MeshLineMesh, RigidBodyType } from "../types/types";
import CardTexture from "./CardTexture";
import { flashcards } from "../data/database";
import { flashcardEvents } from "./FlashcardControls";

extend({ MeshLineGeometry, MeshLineMaterial });
useGLTF.preload("/card.glb");
useTexture.preload("/band.jpg");

const segmentProps = { type: "dynamic", canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 } as const;

const Card = ({ animationDuration = 4 }: { animationDuration?: number }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const cardRef = useRef<THREE.Group>(null);
  const animationProgress = useRef(0);
  const startRotation = useRef(0);
  const targetRotation = useRef(0);
  const isRotating = useRef(false);
  const isQuestionPage = useRef(true);
  const prevIsQuestionPage = useRef(true);

  const fixedPoint = useRef<RigidBodyType>(null);
  const ropeTop = useRef<RigidBodyType>(null);
  const ropeMiddle = useRef<RigidBodyType>(null);
  const ropeBottom = useRef<RigidBodyType>(null);
  const card = useRef<RigidBodyType>(null);
  const bandLine = useRef<MeshLineMesh>(null);

  const { nodes, materials } = useGLTF("/card.glb") as unknown as GLTF;
  const texture = useTexture("/images/band.jpg");

  const { width, height } = useThree((state) => state.size);

  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(Array.from({ length: 4 }, () => new THREE.Vector3()));
    c.curveType = "chordal";
    return c;
  }, []);

  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempVec2 = useMemo(() => new THREE.Vector3(), []);
  const cardAngVel = useMemo(() => new THREE.Vector3(), []);
  const cardRot = useMemo(() => new THREE.Vector3(), []);

  useRopeJoint(fixedPoint as React.RefObject<RigidBodyType>, ropeTop as React.RefObject<RigidBodyType>, [[0, -0.5, 0], [0, 0, 0], 1]);
  useRopeJoint(ropeTop as React.RefObject<RigidBodyType>, ropeMiddle as React.RefObject<RigidBodyType>, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(ropeMiddle as React.RefObject<RigidBodyType>, ropeBottom as React.RefObject<RigidBodyType>, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(ropeBottom as React.RefObject<RigidBodyType>, card as React.RefObject<RigidBodyType>, [[0, 0, 0], [0, 1.45, 0]]);

  useMemo(() => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }, [texture]);

  const elasticOut = (t: number) => {
    const p = .4;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  };

  const triggerRotation = useCallback(() => {
    card.current?.setAngvel({ x: 0, y: 2, z: 0 }, true);
    const currentPos = card.current?.translation();
    card.current?.setTranslation({
      x: (currentPos?.x || 0) + (Math.random() - 0.5) * 0.6,
      y: (currentPos?.y || 0) - Math.random() * 0.1,
      z: (currentPos?.z || 0) + (Math.random() - 0.5) * 0.1,
    });

    const currentY = cardRef.current?.rotation.y ?? 0;
    startRotation.current = currentY;
    targetRotation.current = Math.round((currentY + Math.PI) / Math.PI) * Math.PI;

    animationProgress.current = 0;
    isRotating.current = true;
  }, []);

  useEffect(() => {
    const handleCardChange = (index: number) => setCurrentCardIndex(index);
    const handleFlipCard = () => triggerRotation();

    flashcardEvents.on('cardChange', handleCardChange);
    flashcardEvents.on('flipCard', handleFlipCard);

    return () => {
      flashcardEvents.off('cardChange', handleCardChange);
      flashcardEvents.off('flipCard', handleFlipCard);
    };
  }, [triggerRotation]);

  useFrame((_, delta) => {
    if (isRotating.current && cardRef.current) {
      animationProgress.current += delta;
      const progress = animationProgress.current / animationDuration;

      if (progress >= 1) {
        cardRef.current.rotation.y = targetRotation.current;
        isRotating.current = false;
        flashcardEvents.emit('flipComplete');
      } else {
        const eased = elasticOut(progress);
        cardRef.current.rotation.y =
          startRotation.current + (targetRotation.current - startRotation.current) * eased;
      }
    }

    // Update isQuestionPage based on current rotation
    if (cardRef.current) {
      const currentRotation = cardRef.current.rotation.y;
      // Check if we're on the question side (even multiples of PI)
      const newIsQuestionPage = !((Math.round(currentRotation / Math.PI) % 2));

      // If the state changed, update and emit event
      if (newIsQuestionPage !== prevIsQuestionPage.current) {
        isQuestionPage.current = newIsQuestionPage;
        prevIsQuestionPage.current = newIsQuestionPage;
        flashcardEvents.emit('pageChange', newIsQuestionPage);
      }
    }

    if (!fixedPoint.current) return;

    [ropeTop, ropeMiddle].forEach((ref) => {
      const curr = ref.current;
      if (!curr) return;
      const target = curr.translation();
      curr.lerped ??= tempVec.copy(target);
      const dist = curr.lerped.distanceTo(target);
      const t = 1 - Math.exp(-(10 + Math.min(dist, 1) * (50 - 10)) * delta);
      curr.lerped.lerp(target, t);
    });

    curve.points[0].copy(ropeBottom.current?.translation() || tempVec2);
    curve.points[1].copy(ropeMiddle.current?.translation() || tempVec2);
    curve.points[2].copy(ropeTop.current?.translation() || tempVec2);
    curve.points[3].copy(fixedPoint.current.translation());

    bandLine.current?.geometry.setPoints(curve.getPoints(32));

    cardAngVel.copy(card.current?.angvel() || tempVec2);
    cardRot.copy(card.current?.rotation() || tempVec2);
    card.current?.setAngvel({
      x: cardAngVel.x,
      y: cardAngVel.y - cardRot.y * 0.5,
      z: cardAngVel.z,
    });
  });

  return (
    <>
      <group position={[0, 5.5, 0]}>
        <RigidBody ref={fixedPoint} {...segmentProps} type="fixed" />
        <RigidBody ref={ropeTop} {...segmentProps} position={[0.5, 0, 0]}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={ropeMiddle} {...segmentProps} position={[1, 0, 0]}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={ropeBottom} {...segmentProps} position={[1.5, 0, 1]}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody ref={card} {...segmentProps} position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group scale={3} position={[0, -2.125, -0.05]}>
            <group ref={cardRef} onClick={triggerRotation}>
              <mesh geometry={nodes.card.geometry}>
                <meshPhysicalMaterial roughness={1} clearcoat={.5} clearcoatRoughness={1} metalness={.3}>
                  <RenderTexture colorSpace={THREE.SRGBColorSpace} attach="map" width={1024} height={1024}>
                    <CardTexture
                      question={flashcards[currentCardIndex].question}
                      answer={flashcards[currentCardIndex].answer}
                    />
                  </RenderTexture>
                </meshPhysicalMaterial>
              </mesh>
              <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
            </group>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
          </group>
        </RigidBody>
      </group>

      <mesh ref={bandLine}>
        <meshLineGeometry />
        <meshLineMaterial
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={texture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
};

export default Card;
