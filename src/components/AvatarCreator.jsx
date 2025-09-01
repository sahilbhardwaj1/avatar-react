import { useEffect, useRef } from 'react'

const AvatarCreator = ({ onAvatarExported, subdomain = 'demo' }) => {
  const iframeRef = useRef(null)

  useEffect(() => {
    const handleMessage = (event) => {
      const json = parse(event)
      
      if (json?.source !== 'readyplayerme') {
        return
      }

      // Avatar exported event
      if (json.eventName === 'v1.avatar.exported') {
        console.log('Avatar exported:', json.data.url)
        onAvatarExported?.(json.data.url)
      }

      // Frame loaded event
      if (json.eventName === 'v1.frame.ready') {
        console.log('Ready Player Me frame is ready')
      }
    }

    const parse = (event) => {
      try {
        return JSON.parse(event.data)
      } catch (error) {
        return null
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onAvatarExported])

  const iframeUrl = `https://${subdomain}.readyplayer.me/avatar?frameApi`

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        allow="camera *; microphone *"
      />
    </div>
  )
}

export default AvatarCreator