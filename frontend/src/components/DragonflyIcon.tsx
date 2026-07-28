import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface DragonflyIconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export const DragonflyIcon = ({
  size = 32,
  color = '#D4A843',
  opacity = 1,
}: DragonflyIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <G opacity={opacity}>
        {/* Body */}
        <Path
          d="M32 8 L32 56"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />

        {/* Body segments */}
        <Circle cx={32} cy={14} r={2.5} fill={color} />
        <Circle cx={32} cy={22} r={1.8} fill={color} />
        <Circle cx={32} cy={30} r={1.5} fill={color} />
        <Circle cx={32} cy={38} r={1.3} fill={color} />
        <Circle cx={32} cy={46} r={1.1} fill={color} />
        <Circle cx={32} cy={52} r={0.9} fill={color} />

        {/* Head */}
        <Circle cx={32} cy={10} r={3} fill={color} />
        <Circle cx={30.5} cy={9} r={0.8} fill="#000" opacity={0.4} />
        <Circle cx={33.5} cy={9} r={0.8} fill="#000" opacity={0.4} />

        {/* Upper wings */}
        <Ellipse
          cx={18}
          cy={20}
          rx={14}
          ry={5}
          fill={color}
          opacity={0.35}
          transform="rotate(-20 18 20)"
        />
        <Ellipse
          cx={46}
          cy={20}
          rx={14}
          ry={5}
          fill={color}
          opacity={0.35}
          transform="rotate(20 46 20)"
        />

        {/* Lower wings */}
        <Ellipse
          cx={20}
          cy={28}
          rx={11}
          ry={3.5}
          fill={color}
          opacity={0.3}
          transform="rotate(-15 20 28)"
        />
        <Ellipse
          cx={44}
          cy={28}
          rx={11}
          ry={3.5}
          fill={color}
          opacity={0.3}
          transform="rotate(15 44 28)"
        />

        {/* Wing details - veins */}
        <Path
          d="M8 18 L28 22"
          stroke={color}
          strokeWidth={0.4}
          opacity={0.6}
          fill="none"
        />
        <Path
          d="M36 22 L56 18"
          stroke={color}
          strokeWidth={0.4}
          opacity={0.6}
          fill="none"
        />
        <Path
          d="M10 27 L28 30"
          stroke={color}
          strokeWidth={0.4}
          opacity={0.5}
          fill="none"
        />
        <Path
          d="M36 30 L54 27"
          stroke={color}
          strokeWidth={0.4}
          opacity={0.5}
          fill="none"
        />
      </G>
    </Svg>
  );
};
