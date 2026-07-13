import { type IconConfig } from '@/components/ui/modern-animated-sign-in'
import thdLogo from '../../../assets/THD.svg'
import vigoLogo from '../../../assets/Vigo.webp'
import sintefLogo from '../../../assets/Sintef.webp'
import rubLogo from '../../../assets/RUB.webp'
import auaLogo from '../../../assets/AUA.webp'
import uuLogo from '../../../assets/UU.webp'
import inordeLogo from '../../../assets/Inorde.webp'
import innogandoLogo from '../../../assets/Innogando.webp'
import contacticaLogo from '../../../assets/Contactica.webp'
import gjesdalLogo from '../../../assets/Gjesdal.webp'
import nimmoLogo from '../../../assets/Nimmo.webp'

type Logo = { src: string; alt: string }

// Partner logos spread over 4 orbit rings, evenly spaced within each ring
// (delay = i * duration / count → i/count of a full revolution).
const ORBIT_RINGS: { radius: number; sizeClass: string; reverse: boolean; logos: Logo[] }[] = [
  {
    radius: 100,
    sizeClass: 'size-[52px]',
    reverse: false,
    logos: [
      { src: thdLogo, alt: 'THD' },
      { src: vigoLogo, alt: 'Universidade de Vigo' },
    ],
  },
  {
    radius: 160,
    sizeClass: 'size-[58px]',
    reverse: true,
    logos: [
      { src: sintefLogo, alt: 'SINTEF' },
      { src: rubLogo, alt: 'Ruhr-Universität Bochum' },
    ],
  },
  {
    radius: 220,
    sizeClass: 'size-[64px]',
    reverse: false,
    logos: [
      { src: auaLogo, alt: 'AUA' },
      { src: uuLogo, alt: 'UU' },
      { src: inordeLogo, alt: 'Inorde' },
    ],
  },
  {
    radius: 280,
    sizeClass: 'size-[70px]',
    reverse: true,
    logos: [
      { src: innogandoLogo, alt: 'Innogando' },
      { src: contacticaLogo, alt: 'Contactica' },
      { src: gjesdalLogo, alt: 'Gjesdal' },
      { src: nimmoLogo, alt: 'Nimmo' },
    ],
  },
]

const ORBIT_DURATION = 20

export const partnerOrbitIcons: IconConfig[] = ORBIT_RINGS.flatMap(ring =>
  ring.logos.map((logo, i) => ({
    component: () => (
      <img
        src={logo.src}
        alt={logo.alt}
        className="size-full rounded-full bg-white object-contain p-1 shadow-sm"
      />
    ),
    className: `${ring.sizeClass} border-none bg-transparent`,
    duration: ORBIT_DURATION,
    delay: (i * ORBIT_DURATION) / ring.logos.length,
    radius: ring.radius,
    path: false,
    reverse: ring.reverse,
  }))
)
