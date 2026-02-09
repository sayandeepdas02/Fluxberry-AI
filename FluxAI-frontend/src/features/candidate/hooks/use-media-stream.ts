import { useState, useEffect, useCallback } from 'react'

interface MediaStreamState {
    stream: MediaStream | null
    error: Error | null
    permission: PermissionState | 'prompt' | 'unknown'
}

export function useMediaStream(constraints: MediaStreamConstraints = { video: true, audio: true }) {
    const [state, setState] = useState<MediaStreamState>({
        stream: null,
        error: null,
        permission: 'unknown'
    })

    const request = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            setState({ stream, error: null, permission: 'granted' })
            return stream
        } catch (err) {
            setState({ stream: null, error: err as Error, permission: 'denied' })
            throw err
        }
    }, [constraints]) // Note: constraints obj reference might change, be careful or memoize outside

    const stop = useCallback(() => {
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop())
            setState(s => ({ ...s, stream: null }))
        }
    }, [state.stream])

    useEffect(() => {
        return () => {
            if (state.stream) {
                state.stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [state.stream])

    return { ...state, request, stop }
}
