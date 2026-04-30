import Image from 'next/image'

export function SARSymbol({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/banks/Riyal.png"
      alt="ريال سعودي"
      width={size}
      height={size}
      className={`inline-block align-middle ${className}`}
    />
  )
}
