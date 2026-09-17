import React from 'react';

import { Image } from 'react-native';

interface InstitutionalEmblemProps {
  size?: number;
}

export function InstitutionalEmblem({ size = 72 }: InstitutionalEmblemProps) {
  return (
    <Image
      source={require('../../../assets/logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      width={size}
      height={size}
    />
    // <Svg
    //   viewBox="0 0 160 160"
    //   width={size}
    //   height={size}
    // >
    //   <Defs>
    //     <LinearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
    //       <Stop offset="0%" stopColor="#121820" />
    //       <Stop offset="50%" stopColor="#1A222C" />
    //       <Stop offset="100%" stopColor="#0F141A" />
    //     </LinearGradient>
    //     <LinearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
    //       <Stop offset="0%" stopColor="#FCEECB" />
    //       <Stop offset="35%" stopColor="#DFB76C" />
    //       <Stop offset="70%" stopColor="#B88A34" />
    //       <Stop offset="100%" stopColor="#8C631A" />
    //     </LinearGradient>
    //     <LinearGradient id="silverPlate" x1="0%" y1="0%" x2="100%" y2="100%">
    //       <Stop offset="0%" stopColor="#FFFFFF" />
    //       <Stop offset="50%" stopColor="#CBD5E1" />
    //       <Stop offset="100%" stopColor="#64748B" />
    //     </LinearGradient>
    //   </Defs>

    //   {/* Shield Base */}
    //   <Path
    //     d="M80 12 L128 28 C128 78 102 120 80 144 C58 120 32 78 32 28 Z"
    //     fill="url(#shieldBg)"
    //     stroke="url(#goldPlate)"
    //     strokeWidth="3.5"
    //     strokeLinejoin="round"
    //   />

    //   {/* Inner Precision Inset */}
    //   <Path
    //     d="M80 20 L120 34 C120 74 97 110 80 132 C63 110 40 74 40 34 Z"
    //     fill="none"
    //     stroke="#334155"
    //     strokeWidth="1.5"
    //     opacity="0.85"
    //   />

    //   {/* Left Wing (Protection / Armed Forces) */}
    //   <G fill="url(#goldPlate)" opacity="0.95">
    //     <Path d="M76 44 C66 40 50 38 44 48 C48 54 55 58 74 57 Z" />
    //     <Path d="M75 58 C62 57 48 56 46 68 C52 72 61 74 74 72 Z" />
    //     <Path d="M75 73 C65 74 53 76 52 86 C58 89 67 89 75 84 Z" />
    //     <Path d="M76 86 C69 88 61 93 62 100 C67 101 73 98 77 94 Z" />
    //   </G>

    //   {/* Right Wing */}
    //   <G fill="url(#goldPlate)" opacity="0.95">
    //     <Path d="M84 44 C94 40 110 38 116 48 C112 54 105 58 86 57 Z" />
    //     <Path d="M85 58 C98 57 112 56 114 68 C108 72 99 74 86 72 Z" />
    //     <Path d="M85 73 C95 74 107 76 108 86 C102 89 93 89 85 84 Z" />
    //     <Path d="M84 86 C91 88 99 93 98 100 C93 101 87 98 83 94 Z" />
    //   </G>

    //   {/* Laurel of Honor & Peace at base */}
    //   <Path
    //     d="M60 112 C66 119 73 123 80 124 C87 123 94 119 100 112"
    //     fill="none"
    //     stroke="url(#silverPlate)"
    //     strokeWidth="2"
    //     strokeLinecap="round"
    //     opacity="0.75"
    //   />
    //   <Circle cx="68" cy="116" r="1.5" fill="#E2E8F0" />
    //   <Circle cx="74" cy="120" r="1.5" fill="#E2E8F0" />
    //   <Circle cx="80" cy="122" r="1.5" fill="#E2E8F0" />
    //   <Circle cx="86" cy="120" r="1.5" fill="#E2E8F0" />
    //   <Circle cx="92" cy="116" r="1.5" fill="#E2E8F0" />

    //   {/* Central Cross & Sword */}
    //   <Path
    //     d="M80 32 L80 106"
    //     stroke="url(#silverPlate)"
    //     strokeWidth="4.5"
    //     strokeLinecap="round"
    //   />
    //   <Path
    //     d="M64 54 L96 54"
    //     stroke="url(#silverPlate)"
    //     strokeWidth="4.5"
    //     strokeLinecap="round"
    //   />

    //   {/* Gold Core & Star of Hope */}
    //   <Circle cx="80" cy="54" r="5" fill="url(#goldPlate)" />
    //   <Circle cx="80" cy="54" r="2.2" fill="#FFFFFF" />

    //   {/* Sword Finials */}
    //   <Polygon points="80,26 77,32 83,32" fill="url(#silverPlate)" />
    //   <Polygon points="60,54 65,51 65,57" fill="url(#silverPlate)" />
    //   <Polygon points="100,54 95,51 95,57" fill="url(#silverPlate)" />
    //   <Polygon points="80,111 77,105 83,105" fill="url(#silverPlate)" />
    // </Svg>
  );
}

export default InstitutionalEmblem;
