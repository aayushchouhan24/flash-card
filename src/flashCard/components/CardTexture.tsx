import * as THREE from "three";
import { extend } from '@react-three/fiber';
import { OrthographicCamera, useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";

import { RoundedPlaneGeometry } from "../lib/RoundedPlaneGeometry";
import CreateText from "./CreateText";
import { FlashCard } from "../types/types";

extend({ RoundedPlaneGeometry })


export default function CardTexture({ question, answer }: FlashCard) {

    const templateTexture = useTexture('/images/template.svg')

    const codeRef = useRef<THREE.Group>(null)


    useMemo(() => { fixTexture(templateTexture) }, [templateTexture])

    function fixTexture(texture: THREE.Texture | THREE.CanvasTexture) {
        texture.flipY = false
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = 16
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true
    }

    return (
        <>
            <OrthographicCamera makeDefault manual left={0} right={1024} bottom={0} top={1024} near={0.1} far={10} position={[0, 0, 1]} />

            <mesh position={[512, 512, 0]}>
                <planeGeometry args={[1024, 1024]} />
                <meshBasicMaterial map={templateTexture} />
            </mesh>s

            <group position={[256, 360, 0]}>
                <CreateText fontSize={50}>
                    {question}
                </CreateText>
            </group>

            <group position={[768, 360, 0]}>
                <group ref={codeRef}>
                    <CreateText fontSize={40}>
                        {answer}
                    </CreateText>
                </group>
            </group >



        </>
    );
}
