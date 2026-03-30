import AccessForm from '@/components/AccessForm'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { SmallButton } from '@/components/StyledButtons'
import { logout } from './actions'
import RoomCard from '@/components/RoomCard'
import UserLogoutButton from '@/components/UserLogoutButton'
import HomeGallery from '@/components/HomeGallery'

export default async function Home() {
  const cookieStore = await cookies()
  const accessCode = cookieStore.get('access_code')?.value
  const clientPhone = cookieStore.get('client_phone')?.value
  const supabase = await createClient()

  let isAuthenticated = false

  // Validate client session
  if (accessCode && clientPhone) {
    const { data: code } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', accessCode)
      .eq('phone', clientPhone)
      .eq('is_active', true)
      .single()

    if (code) {
      const now = new Date()
      if (!code.expires_at || new Date(code.expires_at) > now) {
        isAuthenticated = true
      }
    }
  }

  // Fetch active rooms
  const { data: activeRooms } = await supabase
    .from('rooms')
    .select('*, profiles(full_name, avatar_url)')
    .eq('status', 'live')
    .order('created_at', { ascending: false })

  // Fetch gallery images
  let galleryImages = []
  try {
    const { data } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false })
    if (data) galleryImages = data
  } catch (e) {
    console.error('Error fetching gallery images', e)
  }

  // Fallback if no images
  if (galleryImages.length === 0) {
    galleryImages = [
      { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop' },
      { id: '2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop' },
      { id: '3', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop' },
      { id: '4', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1000&auto=format&fit=crop' },
      { id: '5', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop' },
      { id: '6', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop' },
      { id: '7', url: 'https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?q=80&w=1000&auto=format&fit=crop' },
    ]
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-8 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="text-2xl font-black tracking-tighter">
          LIVE<span className="text-gray-400">.APP</span>
        </div>
        <div>
          {isAuthenticated ? (
            <UserLogoutButton />
          ) : (
            <Link href="/login" className="text-sm font-semibold uppercase tracking-wider border border-gray-200 px-4 py-2 rounded hover:bg-gray-50 transition-colors text-gray-900">
              Acceso Modelos
            </Link>
          )}
        </div>
      </nav>

      {/* Gallery Section - Moved to Top */}
      <HomeGallery images={galleryImages} />

      {/* Hero Section */}
      <section className="py-2 sm:py-2 px-4 text-center border-b border-gray-100">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 max-w-4xl mx-auto leading-tight">
          Experiencias en vivo, <br />
          <span className="text-gray-500">exclusivas y privadas.</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
          Accede a contenido premium en tiempo real. Interactúa con tus modelos favoritas en un entorno seguro y de alta calidad.
        </p>

        <div className="mb-8 p-4 bg-gray-50 rounded-xl max-w-xl mx-auto border border-gray-200">
          <p className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">
            ¿Quieres comprar un código de acceso?
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Escríbenos al WhatsApp para conocer precios y adquirir tu tiempo.
            <br />
            <strong>Tiempos disponibles:</strong> 5 minutos, 15 minutos, 30 minutos, 1 hora, o personalizado.
          </p>
          <a
            href="https://wa.me/573159933572"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transition-transform shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            Contactar por WhatsApp
          </a>
        </div>

        {/* Access Form Container */}
        {!isAuthenticated && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
              Ingresa tu Código
            </h3>
            <AccessForm />
          </div>
        )}
      </section>

      {/* Live Rooms Grid */}
      <section className="py-16 px-4 sm:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">
              En Vivo Ahora ({activeRooms?.length || 0})
            </h2>
          </div>

          {activeRooms && activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeRooms.map(room => (
                <RoomCard key={room.id} room={room} isAuthenticated={isAuthenticated} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-base font-medium">No hay transmisiones activas en este momento.</p>
              <p className="text-sm mt-2">Vuelve pronto para más contenido exclusivo.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Live App. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
