/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.externals.push({
            encoding: 'encoding',
            'utf-8-validate': 'utf-8-validate',
            bufferutil: 'bufferutil',
        });
        return config;
    },
}

module.exports = nextConfig
