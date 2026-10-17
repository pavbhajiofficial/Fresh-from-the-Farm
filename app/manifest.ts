import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'fresh from the farm',
    short_name: 'Fresh Farm',
    description: 'Fair for everyone — Direct from farmers to buyers',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F4D5',
    theme_color: '#F7F4D5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
