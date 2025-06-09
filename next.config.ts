import type {NextConfig} from 'next';
import _withPWA from '@ducanh2912/next-pwa';

const withPWA = _withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development mode
  register: true, // Auto register service worker
  // scope: '/', // Default scope
  // sw: 'sw.js', // Default service worker file name
  // workboxOptions: { disableDevLogs: true } // To disable workbox logs in development
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
