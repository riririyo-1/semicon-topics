/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:4000/api/:path*',
      },
    ];
  },
  images: {
    domains: [
      'www3.nhk.or.jp',
      'placehold.co',
      'www.nikkei.com',
      'www.itmedia.co.jp',
      'www.nikkan.co.jp',
      'techfactory.itmedia.co.jp',
      'monoist.itmedia.co.jp',
      'xtech.itmedia.co.jp',
      'news.mynavi.jp',
      'corporate.murata.com',
      'image.itmedia.co.jp'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
};

module.exports = nextConfig;