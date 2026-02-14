import { ImageResponse } from 'next/og'
import { getPublicHotel } from '@/app/actions/public'

export const runtime = 'edge'

export const alt = 'Hotel Details - COP17 Mongolia'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
    const hotel = await getPublicHotel(params.id)

    if (!hotel) {
        return new ImageResponse(
            (
                <div style={{ width: '100%', height: '100%', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48 }}>
                    Hotel Not Found
                </div>
            ),
            { ...size }
        )
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #000000, #18181b)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    padding: 60,
                    fontFamily: 'sans-serif',
                    color: 'white',
                }}
            >
                {/* Background Gradient/Pattern */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 600, height: 600, background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    marginBottom: 'auto'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '8px 16px',
                        borderRadius: 20,
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#fbbf24'
                    }}>
                        COP17 Partner Hotel
                    </div>
                    {hotel.stars ? (
                        <div style={{ fontSize: 32, color: '#fbbf24' }}>
                            {'★'.repeat(hotel.stars)}
                        </div>
                    ) : null}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 10 }}>
                    {hotel.hotel_type && (
                        <div style={{ fontSize: 24, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 2 }}>
                            {hotel.hotel_type}
                        </div>
                    )}
                    <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
                        {hotel.name}
                    </div>
                    <div style={{ fontSize: 32, color: '#d4d4d8', marginTop: 10, maxWidth: '80%' }}>
                        {hotel.address || 'Ulaanbaatar, Mongolia'}
                    </div>
                </div>

                <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ fontSize: 24, color: '#71717a' }}>
                        Book securely on the official platform
                    </div>
                </div>

                {/* Footer Branding */}
                <div style={{ position: 'absolute', bottom: 60, right: 60, opacity: 0.5, fontSize: 24, fontWeight: 'bold', letterSpacing: 2 }}>
                    COP17 MONGOLIA
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
