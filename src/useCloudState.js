import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase, isCloudEnabled } from './supabase'

export function useCloudState(key, defaultValue) {
  const fullKey = `stylum_${key}`
  
  const [state, setState] = useState(() => {
    try {
      const cached = localStorage.getItem(fullKey)
      return cached ? JSON.parse(cached) : defaultValue
    } catch {
      return defaultValue
    }
  })
  
  const [loaded, setLoaded] = useState(!isCloudEnabled)
  const [cloudStatus, setCloudStatus] = useState(isCloudEnabled ? 'syncing' : 'local')
  const saveTimer = useRef(null)

  useEffect(() => {
    if (!isCloudEnabled) return
    
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('app_data')
          .select('value')
          .eq('key', fullKey)
          .single()
        
        if (data && !error) {
          const cloudValue = data.value
          setState(cloudValue)
          localStorage.setItem(fullKey, JSON.stringify(cloudValue))
          setCloudStatus('synced')
        } else if (error && error.code === 'PGRST116') {
          const localData = (() => {
            try {
              const cached = localStorage.getItem(fullKey)
              return cached ? JSON.parse(cached) : defaultValue
            } catch { return defaultValue }
          })()
          
          await supabase.from('app_data').insert({
            key: fullKey,
            value: localData,
            updated_at: new Date().toISOString()
          })
          setCloudStatus('synced')
        }
      } catch (err) {
        console.warn('Cloud load failed, using local:', err)
        setCloudStatus('offline')
      }
      setLoaded(true)
    })()
  }, [fullKey])

  const setAndPersist = useCallback((newVal) => {
    setState(prev => {
      const value = typeof newVal === 'function' ? newVal(prev) : newVal
      
      try {
        localStorage.setItem(fullKey, JSON.stringify(value))
      } catch {}
      
      if (isCloudEnabled) {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
          try {
            setCloudStatus('syncing')
            const { error } = await supabase
              .from('app_data')
              .upsert({
                key: fullKey,
                value: value,
                updated_at: new Date().toISOString()
              }, { onConflict: 'key' })
            
            if (error) throw error
            setCloudStatus('synced')
          } catch (err) {
            console.warn('Cloud save failed:', err)
            setCloudStatus('offline')
          }
        }, 500)
      }
      
      return value
    })
  }, [fullKey])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return [state, setAndPersist, loaded, cloudStatus]
}
