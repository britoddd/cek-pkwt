import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

// Results are kept briefly in this browser only, so a reload or an accidentally closed tab doesn't
// lose them. Nothing here is sent anywhere. Each value expires TTL_MINUTES after its last change.
// The raw contract text is deliberately never stored: it still holds unredacted personal data.
export const TTL_MINUTES = 30
const PREFIX = 'cekpkwt:'

interface Entry<T> {
  value: T
  expires: number
}

function storedKeys(): string[] {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
  } catch {
    return [] // storage blocked (e.g. some private modes): the app just works in memory
  }
}

function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return undefined
    const entry: Entry<T> = JSON.parse(raw)
    if (Date.now() < entry.expires) return entry.value
    localStorage.removeItem(PREFIX + key)
  } catch {
    // corrupt or blocked: treat as empty
  }
  return undefined
}

function write(key: string, value: unknown) {
  try {
    if (value === null || (Array.isArray(value) && value.length === 0)) localStorage.removeItem(PREFIX + key)
    else localStorage.setItem(PREFIX + key, JSON.stringify({ value, expires: Date.now() + TTL_MINUTES * 60_000 }))
  } catch {
    // quota full or blocked: keep working in memory
  }
}

// Drop anything already expired, including keys this visit never reads.
for (const key of storedKeys()) read(key.slice(PREFIX.length))

export function useStoredState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read<T>(key) ?? initial)
  useEffect(() => write(key, value), [key, value])
  return [value, setValue]
}

export function clearStored() {
  try {
    for (const key of storedKeys()) localStorage.removeItem(key)
  } catch {
    // nothing stored
  }
}
