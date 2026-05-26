import { useCallback, useState } from 'react'

function useToggle(initialValue = false) {
  const [value, setValue] = useState(Boolean(initialValue))

  const toggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  const setOn = useCallback(() => setValue(true), [])
  const setOff = useCallback(() => setValue(false), [])

  return { value, toggle, setOn, setOff, setValue }
}

export default useToggle
