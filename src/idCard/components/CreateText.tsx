import { Text, TextProps } from "@react-three/drei";
import { Mesh } from "three";

interface CreateTextProps extends TextProps {
    preventWordBreak?: boolean;
    setTransform?: (e: Mesh, width: number, height: number) => void;
}

const CreateText = ({ children, preventWordBreak, ...opts }: CreateTextProps) => {
    return (
        <Text
            scale={[1, -1, 1]}
            maxWidth={480}
            overflowWrap={preventWordBreak ? "normal" : "break-word"}
            font={opts.font || "/font/noto.ttf"}
            color={opts.color || "white"}
            textAlign="center"
            {...opts}
        >
            {children}
        </Text>
    )
}

export default CreateText