import { useCallback, useState } from 'react'

const useInputFloat = (
  key,
  { min, max, step } = {},
  defaultValue = undefined,
) => {
  const parse = useCallback(
    (string) => {
      let value = parseFloat(string, 10)

      if (typeof value !== 'number' || isNaN(value)) {
        return defaultValue
      }

      if (min !== undefined) {
        value = Math.max(min, value)
      }

      if (max !== undefined) {
        value = Math.min(max, value)
      }

      return value
    },
    [min, max, defaultValue],
  )

  const [value, setValue] = useState(() => parse(localStorage.getItem(key)))

  const handleChange = useCallback(
    ({ target: { value: newValue } }) => {
      const parsedValue = parse(newValue)

      localStorage.setItem(key, parsedValue)
      setValue(parsedValue)
    },
    [key, parse],
  )

  return {
    type: 'number',
    min,
    max,
    step,
    value,
    onChange: handleChange,
  }
}

export default useInputFloat
