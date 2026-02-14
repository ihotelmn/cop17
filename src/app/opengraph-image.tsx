import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'COP17 Mongolia - Official Accommodation Platform'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #18181b, #09090b)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    color: 'white',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                        opacity: 0.5,
                    }}
                >
                    {/* Logo Placeholder or Text */}
                    <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: '4px' }}>COP17 MONGOLIA</div>
                </div>

                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 900,
                        textAlign: 'center',
                        lineHeight: 1.1,
                        backgroundImage: 'linear-gradient(to bottom right, #fbbf24, #d97706)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        padding: '0 40px',
                        marginBottom: 20,
                    }}
                >
                    Official Accommodation Platform
                </div>

                <div style={{ fontSize: 32, color: '#a1a1aa', maxWidth: 800, textAlign: 'center' }}>
                    Secure your stay for the 17th Conference of the Parties in Ulaanbaatar.
                </div>

                {/* Decorative elements */}
                <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: '#d97706', borderRadius: '50%', opacity: 0.1, filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, background: '#fbbf24', borderRadius: '50%', opacity: 0.1, filter: 'blur(100px)' }} />
            </div>
        ),
        {
            ...size,
        }
    )
}
