import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    output: 'export',
    basePath: '/us/no-tax-on-social-security-dashboard',
    // Phase-gated: undefined in `next dev` (local paths work),
    // /_zones/no-tax-on-social-security-dashboard in builds (assets don't collide with host).
    assetPrefix: isDev ? undefined : '/_zones/no-tax-on-social-security-dashboard',
    trailingSlash: true,
    images: { unoptimized: true },
  };
}
