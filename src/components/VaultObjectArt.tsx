import { memo, useId } from 'react';
import { VaultArtifactId } from '../types';

export type ObjectArtSize = 'xs' | 'sm' | 'md' | 'lg';

interface VaultObjectArtProps {
  artifactId: VaultArtifactId;
  size?: ObjectArtSize;
  className?: string;
}

const PX_MAP: Record<ObjectArtSize, number> = {
  xs: 18,
  sm: 26,
  md: 40,
  lg: 56,
};

export const VaultObjectArt = memo(function VaultObjectArt({
  artifactId,
  size = 'md',
  className = '',
}: VaultObjectArtProps) {
  const uid = useId().replace(/:/g, '');
  const px = PX_MAP[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 64 64"
        width={px}
        height={px}
        className="overflow-visible drop-shadow-[0_3px_8px_rgba(6,24,68,0.32)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-dna`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`${uid}-pend`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id={`${uid}-flask`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DDD6FE" />
            <stop offset="52%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id={`${uid}-astro`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id={`${uid}-crown`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        {artifactId === 'dna_helix' && (
          <g>
            <circle cx="32" cy="32" r="24" fill="#10B981" fillOpacity="0.14" stroke="#34D399" strokeWidth="1.4" strokeOpacity="0.55" />
            <path
              d="M21 12 C21 23 43 23 43 32 C43 41 21 41 21 52"
              fill="none"
              stroke={`url(#${uid}-dna)`}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M43 12 C43 23 21 23 21 32 C21 41 43 41 43 52"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line x1="23" y1="18" x2="41" y2="18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="25" y1="26" x2="39" y2="26" stroke="#67E8F9" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="25" y1="38" x2="39" y2="38" stroke="#67E8F9" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="23" y1="46" x2="41" y2="46" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="21" cy="12" r="3" fill="#FFFFFF" />
            <circle cx="43" cy="52" r="3" fill="#34D399" />
          </g>
        )}

        {artifactId === 'quantum_pendulum' && (
          <g>
            <circle cx="32" cy="34" r="22" fill="#F97316" fillOpacity="0.14" stroke="#FB923C" strokeWidth="1.5" strokeOpacity="0.6" />
            <rect x="27" y="7" width="10" height="5" rx="2" fill="#FDE68A" />
            <circle cx="32" cy="34" r="17" fill="#431407" fillOpacity="0.45" stroke={`url(#${uid}-pend)`} strokeWidth="2.8" />
            <circle cx="32" cy="34" r="12" fill="none" stroke="#FED7AA" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="32" y1="34" x2="32" y2="22" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="32" y1="34" x2="41" y2="38" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="32" cy="34" r="3.4" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.2" />
          </g>
        )}

        {artifactId === 'alchemist_flask' && (
          <g>
            <circle cx="32" cy="35" r="22" fill="#8B5CF6" fillOpacity="0.14" stroke="#A78BFA" strokeWidth="1.4" strokeOpacity="0.55" />
            <rect x="26" y="10" width="12" height="4" rx="2" fill="#E9D5FF" />
            <path
              d="M27 14 L27 25 L14 48 C12.5 51 14.5 54 18 54 L46 54 C49.5 54 51.5 51 50 48 L37 25 L37 14 Z"
              fill="#1E1B4B"
              fillOpacity="0.5"
              stroke="#E9D5FF"
              strokeWidth="2.2"
            />
            <path
              d="M21 37 L43 37 L48 48 C48.8 49.8 47.6 51.5 45.5 51.5 L18.5 51.5 C16.4 51.5 15.2 49.8 16 48 Z"
              fill={`url(#${uid}-flask)`}
            />
            <circle cx="28" cy="44" r="2.6" fill="#FFFFFF" fillOpacity="0.85" />
            <circle cx="37" cy="41" r="2" fill="#67E8F9" />
            <circle cx="32" cy="31" r="1.8" fill="#C4B5FD" />
          </g>
        )}

        {artifactId === 'astrolabe_compass' && (
          <g>
            <circle cx="32" cy="32" r="23" fill={`url(#${uid}-astro)`} fillOpacity="0.22" stroke="#7DD3FC" strokeWidth="2.2" />
            <circle cx="32" cy="32" r="16" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeDasharray="4 3" />
            <polygon points="32,12 37,30 32,34 27,30" fill="#FFFFFF" />
            <polygon points="32,52 37,34 32,30 27,34" fill="#38BDF8" />
            <polygon points="12,32 30,27 34,32 30,37" fill="#A5F3FC" />
            <polygon points="52,32 34,27 30,32 34,37" fill="#0284C7" />
            <circle cx="32" cy="32" r="4.2" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
          </g>
        )}

        {artifactId === 'zenith_crown_relic' && (
          <g>
            <circle cx="32" cy="32" r="25" fill="#F59E0B" fillOpacity="0.16" stroke={`url(#${uid}-crown)`} strokeWidth="1.8" />
            <polygon points="32,7 41,22 54,17 48,43 16,43 10,17 23,22" fill={`url(#${uid}-crown)`} stroke="#FEF9C3" strokeWidth="2" />
            <rect x="17" y="45" width="30" height="6" rx="3" fill="#0F172A" stroke="#FDE047" strokeWidth="1.6" />
            <polygon points="32,21 37,30 32,38 27,30" fill="#FFFFFF" />
            <circle cx="10" cy="15" r="2.6" fill="#22D3EE" />
            <circle cx="54" cy="15" r="2.6" fill="#22D3EE" />
            <circle cx="32" cy="7" r="3" fill="#FFFFFF" />
          </g>
        )}
      </svg>
    </span>
  );
});
