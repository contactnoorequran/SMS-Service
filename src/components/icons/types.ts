import React from 'react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  title?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}
