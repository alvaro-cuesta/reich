import { useCallback, useState } from 'react'

const useInputCheckbox = (key, defaultValue = false) => {
  const parse = useCallback(
    (string) =>
      string === true || string === 'true'
        ? true
        : string === false || string === 'false'
        ? false
        : defaultValue,
    [defaultValue],
  )

  const [checked, setChecked] = useState(() => parse(localStorage.getItem(key)))

  const handleChange = useCallback(
    ({ target: { checked } }) => {
      const newChecked = parse(checked)

      localStorage.setItem(key, newChecked)
      setChecked(newChecked)
    },
    [key, parse],
  )

  return {
    type: 'checkbox',
    checked,
    onChange: handleChange,
  }
}

export default useInputCheckbox
