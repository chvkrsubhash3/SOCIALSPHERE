'use client';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  story?: boolean;
  className?: string;
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const GRADIENTS = [
  'from-brand-500 to-accent-purple',
  'from-accent-pink to-accent-amber',
  'from-accent-cyan to-brand-500',
  'from-accent-emerald to-accent-cyan',
  'from-accent-amber to-accent-pink',
];

function getGradient(name: string): string {
  const index = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function Avatar({ src, name, size = 'md', ring = false, story = false, className = '' }: AvatarProps) {
  const sizeClass = SIZES[size];
  const initial = name?.[0]?.toUpperCase() || '?';
  const gradient = getGradient(name || '?');

  const avatar = src ? (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover`}
    />
  ) : (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}>
      {initial}
    </div>
  );

  if (story) {
    return (
      <div className={`story-ring inline-flex ${className}`}>
        <div className="m-0.5">
          {avatar}
        </div>
      </div>
    );
  }

  if (ring) {
    return (
      <div className={`avatar-ring inline-flex rounded-full ${className}`}>
        {avatar}
      </div>
    );
  }

  return <div className={`inline-flex ${className}`}>{avatar}</div>;
}
