'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mic, MicOff, Video, VideoOff, RefreshCw, Sparkles } from 'lucide-react'


interface VideoStreamProps {
    isModel: boolean
    roomId: string
    userId: string
}

// Configuración TURN desde variables de entorno
const TURN_SERVER = process.env.NEXT_PUBLIC_TURN_SERVER || 'openrelay.metered.ca'
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || 'openrelayproject'
const TURN_PASSWORD = process.env.NEXT_PUBLIC_TURN_PASSWORD || 'openrelayproject'

const RTC_CONFIG = {
    iceServers: [
        // STUN servers (gratuitos)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // TURN server (configurable via .env)
        {
            urls: `turn:${TURN_SERVER}:3478`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD
        },
        {
            urls: `turn:${TURN_SERVER}:3478?transport=tcp`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD
        },
        {
            urls: `turns:${TURN_SERVER}:5349`,
            username: TURN_USERNAME,
            credential: TURN_PASSWORD
        }
    ],
    iceCandidatePoolSize: 10
}

export default function VideoStream({ isModel, roomId, userId }: VideoStreamProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const isConnectedRef = useRef(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [statusMessage, setStatusMessage] = useState('Conectando con la modelo...')


    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({})
    const iceCandidatesQueue = useRef<{ [key: string]: RTCIceCandidateInit[] }>({})

    const supabase = useMemo(() => createClient(), [])
    const channelRef = useRef<any>(null)
    const viewerIdRef = useRef<string>(userId)

    useEffect(() => {
        isConnectedRef.current = isConnected
    }, [isConnected])

    useEffect(() => {
        if (!roomId) return

        const init = async () => {
            if (isModel) {
                await startLocalStream()
                setupSignaling()
            } else {
                setupSignaling()
            }
        }
        init()

        const handleBeforeUnload = () => {
            if (isModel) {
                const data = JSON.stringify({ roomId })
                const blob = new Blob([data], { type: 'application/json' })
                navigator.sendBeacon('/api/end-stream', blob)
            }
        }

        if (isModel) {
            window.addEventListener('beforeunload', handleBeforeUnload)
        }

        let retryInterval: NodeJS.Timeout
        if (!isModel) {
            retryInterval = setInterval(() => {
                if (!isConnectedRef.current && channelRef.current) {
                    console.log('Retrying connection...')
                    joinRoom()
                }
            }, 3000)
        }

        // Periodic security check for Model
        let securityInterval: NodeJS.Timeout
        if (isModel) {
            securityInterval = setInterval(async () => {
                const connectedPeers = Object.keys(peerConnections.current)
                for (const peerId of connectedPeers) {
                    const isAllowed = await verifyGuestAccess(peerId)
                    if (!isAllowed) {
                        console.log(`[SECURITY] Kicking revoked/expired peer: ${peerId}`)
                        if (peerConnections.current[peerId]) {
                            peerConnections.current[peerId].close()
                            delete peerConnections.current[peerId]
                        }
                    }
                }
            }, 10000) // Check every 10 seconds
        }

        return () => {
            stopStream()
            Object.values(peerConnections.current).forEach(pc => pc.close())
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
            if (isModel) {
                window.removeEventListener('beforeunload', handleBeforeUnload)
                clearInterval(securityInterval)
            }
            if (retryInterval) clearInterval(retryInterval)
        }
    }, [isModel, roomId, supabase, userId])



    const startLocalStream = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            })
            setLocalStream(mediaStream)
            localStreamRef.current = mediaStream

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                videoRef.current.volume = 0
            }
        } catch (error) {
            console.error('Error accessing media devices:', error)
            alert('Error: No se pudo acceder a la cámara o micrófono.')
        }
    }

    const joinRoom = () => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'join',
                payload: {
                    userId: viewerIdRef.current,
                    senderId: viewerIdRef.current
                }
            })
        }
    }

    const verifyGuestAccess = async (guestId: string): Promise<boolean> => {
        if (!guestId.startsWith('guest_')) return true // Allow non-guest users (e.g. other models/admins if any)

        const code = guestId.split('_')[1]
        const { data, error } = await supabase
            .from('access_codes')
            .select('is_active, expires_at, duration_minutes, created_at')
            .eq('code', code)
            .single()

        if (error || !data || !data.is_active) {
            console.warn(`[SECURITY] Access denied for ${guestId}: Invalid or inactive code`)
            return false
        }

        let expiresAt = 0
        if (data.expires_at) {
            expiresAt = new Date(data.expires_at).getTime()
        } else {
            expiresAt = new Date(data.created_at).getTime() + (data.duration_minutes * 60000)
        }

        if (Date.now() > expiresAt) {
            console.warn(`[SECURITY] Access denied for ${guestId}: Expired`)
            return false
        }

        return true
    }

    const setupSignaling = () => {
        const channel = supabase.channel(`signaling:${roomId}`)
        channelRef.current = channel

        channel
            .on('broadcast', { event: 'join' }, async ({ payload }) => {
                if (!isModel) return

                if (!localStreamRef.current) {
                    console.warn('Viewer joined but local stream not ready yet')
                    return
                }

                console.log('Viewer joined:', payload.senderId)

                // SECURITY CHECK
                const isAllowed = await verifyGuestAccess(payload.senderId)
                if (!isAllowed) {
                    console.error('Blocking unauthorized viewer:', payload.senderId)
                    return
                }

                createPeerConnection(payload.senderId, true, channel)
            })
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                if (isModel) return
                // Filter: Only accept offers intended for ME
                if (payload.targetId !== viewerIdRef.current) return

                console.log('Received offer from model')
                setStatusMessage('Recibiendo señal de video...')
                await handleOffer(payload, channel)
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                if (!isModel) return
                // Filter: Only accept answers intended for ME (though usually model doesn't send answer to viewer in this flow, but good practice)
                if (payload.targetId !== viewerIdRef.current) return

                console.log('Received answer from viewer:', payload.senderId)
                const pc = peerConnections.current[payload.senderId] // Wait, if I am viewer, sender is model.
                // Actually, if I am viewer, I only have one connection.
                // But wait, the logic below says `peerConnections.current[payload.userId]`.
                // If I am viewer, `payload.userId` (from old code) was confusing.
                // Let's assume payload.senderId is 'model'.

                // In this architecture:
                // Model initiates. Model sends Offer. Viewer sends Answer.
                // So Viewer NEVER receives 'answer'.
                // Model receives 'answer'.

                // Let's fix the Model side receiving Answer:
            })
            // Correct handler for ANSWER (Model side)
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                if (!isModel) return // Only model receives answers in this flow

                console.log('Received answer from:', payload.senderId)
                const pc = peerConnections.current[payload.senderId]
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
                    processIceQueue(payload.senderId, pc)
                }
            })
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                // Filter: Is this for me?
                if (payload.targetId !== (isModel ? 'model' : viewerIdRef.current)) return

                const sourceId = payload.senderId
                // If I am model, sourceId is viewer ID.
                // If I am viewer, sourceId is 'model'.

                const pcId = isModel ? sourceId : 'model'
                const pc = peerConnections.current[pcId]

                if (pc && pc.remoteDescription) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
                    } catch (e) {
                        console.error('Error adding ice candidate', e)
                    }
                } else {
                    if (!iceCandidatesQueue.current[pcId]) {
                        iceCandidatesQueue.current[pcId] = []
                    }
                    iceCandidatesQueue.current[pcId].push(payload.candidate)
                }
            })
            .subscribe((status) => {
                console.log('Signaling status:', status)
                if (status === 'SUBSCRIBED' && !isModel) {
                    console.log('I am viewer:', viewerIdRef.current)
                    joinRoom()
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Signaling channel error, retrying...')
                    setStatusMessage('Error de conexión, reintentando...')
                }
            })
    }

    const processIceQueue = async (userId: string, pc: RTCPeerConnection) => {
        const queue = iceCandidatesQueue.current[userId]
        if (queue && queue.length > 0) {
            console.log(`Processing ${queue.length} queued ICE candidates for ${userId}`)
            for (const candidate of queue) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate))
                } catch (e) {
                    console.error('Error processing queued ice candidate', e)
                }
            }
            iceCandidatesQueue.current[userId] = []
        }
    }

    const createPeerConnection = async (targetUserId: string, amIInitiator: boolean, channel: any) => {
        if (peerConnections.current[targetUserId]) {
            peerConnections.current[targetUserId].close()
        }

        const pc = new RTCPeerConnection(RTC_CONFIG)

        if (isModel) {
            peerConnections.current[targetUserId] = pc
        } else {
            peerConnections.current['model'] = pc
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: {
                        candidate: event.candidate,
                        senderId: isModel ? 'model' : viewerIdRef.current,
                        targetId: isModel ? targetUserId : 'model'
                    }
                })
            }
        }

        pc.onconnectionstatechange = () => {
            console.log(`Connection state change for ${targetUserId}:`, pc.connectionState)
            if (pc.connectionState === 'connected') {
                setIsConnected(true)
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setIsConnected(false)
                setStatusMessage('Conexión perdida, reconectando...')
            }
        }

        const stream = localStreamRef.current
        if (isModel && stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream))
        } else {
            pc.ontrack = (event) => {
                console.log('Received track')
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0]
                    setIsConnected(true)
                }
            }
        }

        if (amIInitiator) {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: {
                    sdp: offer,
                    senderId: 'model',
                    targetId: targetUserId
                }
            })
        }

        return pc
    }

    const handleOffer = async (payload: any, channel: any) => {
        const pc = await createPeerConnection('model', false, channel)
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))

        await processIceQueue('model', pc)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: {
                sdp: answer,
                senderId: viewerIdRef.current,
                targetId: 'model'
            }
        })
    }

    const stopStream = () => {
        const stream = localStreamRef.current
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setLocalStream(null)
            localStreamRef.current = null
        }
    }

    const toggleMute = () => {
        const stream = localStreamRef.current
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled
            })
            setIsMuted(!isMuted)
        }
    }

    const toggleVideo = () => {
        const stream = localStreamRef.current
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled
            })
            setIsVideoOff(!isVideoOff)
        }
    }

    const handleManualReconnect = () => {
        setIsConnected(false)
        setStatusMessage('Reconectando...')
        joinRoom()
    }



    return (
        <div className="relative w-full h-full bg-black">
            {isModel ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={true} // Muted for model to avoid echo
                    className="w-full h-full object-cover transform -scale-x-100" // Mirror effect for model
                />
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className="w-full h-full object-cover"
                />
            )}

            {!isModel && !isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-10">
                    <div className="mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 sm:border-3 border-gray-700 border-t-white animate-spin"></div>
                    </div>
                    <div className="text-base sm:text-lg font-medium">{statusMessage}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-2">
                        Esperando stream...
                    </div>
                    <button
                        onClick={handleManualReconnect}
                        className="mt-4 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white cursor-pointer flex items-center gap-2 text-xs sm:text-sm hover:bg-white/20 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /> Reintentar
                    </button>
                </div>
            )}

            {isModel && (
                <div className="absolute top-14 sm:top-20 right-2 sm:right-4 flex flex-col gap-3 z-10">
                    <button
                        onClick={toggleMute}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all backdrop-blur-md ${isMuted ? 'bg-red-500' : 'bg-black/40 hover:bg-black/60'
                            }`}
                    >
                        {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all backdrop-blur-md ${isVideoOff ? 'bg-red-500' : 'bg-black/40 hover:bg-black/60'
                            }`}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                    </button>

                </div>
            )}
        </div>
    )
}
