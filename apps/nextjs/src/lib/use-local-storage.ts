import { useEffect, useState } from "react"

const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const item = window.localStorage.getItem(key)

  const getItemSafe = (item: string | null) => {
    try {
      if (item) {
        return JSON.parse(item) as T
      }
      return initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState(
    item ? getItemSafe(item) : initialValue
  )

  useEffect(() => {
    // Retrieve from localStorage
    const item = window.localStorage.getItem(key)
    if (item) {
      setStoredValue(getItemSafe(item))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value)
    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(value))
  }
  return [storedValue, setValue]
}

export default useLocalStorage
