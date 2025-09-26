'use client';

import React from 'react';
import Image from 'next/image';

interface RevaniLogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

export default function RevaniLogo({ size = 'medium', className = '', style = {} }: RevaniLogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '180px',
          height: '60px',
          fontSize: '14px'
        };
      case 'large':
        return {
          width: '300px',
          height: '90px',
          fontSize: '24px'
        };
      default: // medium
        return {
          width: '240px',
          height: '75px',
          fontSize: '18px'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div
      className={className}
      style={{
        ...sizeStyles,
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      <Image
        src="/revani-logo.png"
        alt="REVANI"
        width={200}
        height={60}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        onLoad={() => console.log('Logo loaded successfully')}
        onError={() => {
          console.error('Logo image failed to load from /revani-logo.png');
        }}
      />
    </div>
  );
}
