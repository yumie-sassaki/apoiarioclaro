'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface LogoProps {
  href?: string;
  onClick?: () => void;
  iconSize?: number;
  textSize?: string;
  textClassName?: string;
  className?: string;
  priority?: boolean;
  showText?: boolean;
}

export interface BrandNameProps {
  className?: string;
}

export const BrandName: React.FC<BrandNameProps> = ({ className = '' }) => (
  <span className={`font-nunito font-extrabold tracking-tight ${className}`}>
    <span className="text-[#0D4183]">Apoia</span>{' '}
    <span className="text-[#2575D0]">Rio Claro</span>
  </span>
);

export const Logo: React.FC<LogoProps> = ({
  href,
  onClick,
  iconSize = 40,
  textSize = 'text-xl sm:text-2xl',
  textClassName = '',
  className = '',
  priority = false,
  showText = true,
}) => {
  const content = (
    <>
      <Image
        src="/logo-icon.png"
        alt="Apoia Rio Claro"
        width={iconSize}
        height={iconSize}
        priority={priority}
        className="object-contain shrink-0 transition-transform group-hover:scale-105"
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
      />
      {showText && (
        <BrandName className={`${textSize} leading-none select-none ${textClassName}`} />
      )}
    </>
  );

  const containerClasses = `inline-flex items-center gap-2.5 sm:gap-3 group ${className}`;

  if (href) {
    return (
      <Link href={href} className={containerClasses} title="Apoia Rio Claro">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${containerClasses} cursor-pointer text-left`}
        title="Apoia Rio Claro"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
};

export default Logo;
