import React, { useState } from 'react'

// Tier 1 Fallback: A high-quality football image from a reliable CDN
const PRIMARY_PLACEHOLDER = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80";

// Tier 2 Fallback: A base64 encoded SVG icon (Guaranteed to load even offline/blocked)
const ABSOLUTE_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIyIDEyYzAtNS41MjMtNC40NzctMTAtMTAtMTBTMiA2LjQ3NyAyIDEyczQuNDc3IDEwIDEwIDEwIDEwLTQuNDc3IDEwLTEwWiIvPjxwYXRoIGQ9Ik0xMiAydjIwTTIgMTJoMjAiLz48L3N2Zz4=";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [errorCount, setErrorCount] = useState(0)

  const handleError = () => {
    setErrorCount(prev => prev + 1)
  }

  const { src, alt, style, className, ...rest } = props

  let finalSrc = src;
  if (!src || errorCount === 1) {
    finalSrc = PRIMARY_PLACEHOLDER;
  } else if (errorCount >= 2) {
    finalSrc = ABSOLUTE_FALLBACK;
  }

  return (
    <img 
      src={finalSrc} 
      alt={alt} 
      className={className} 
      style={style} 
      {...rest} 
      onError={handleError} 
    />
  )
}
