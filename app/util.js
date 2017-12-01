export const flatten = arrays => [].concat.apply([], arrays)

export const mapObject = (obj, fn) => Object.keys(obj)
  .reduce((res, key) => {
      res[key] = fn(obj[key]);
      return res;
    },
    {}
  )

export const deepMap = (obj, fn) => {
  const deepMapper = val => deepMap(val, fn)

  if (Array.isArray(obj)) return fn(obj.map(deepMapper))
  if (typeof obj === 'object') return fn(mapObject(obj, deepMapper))
  return fn(obj)
}

export const count = (array) => array.reduce((count, x) => {
  if (typeof count[x] !== 'undefined') {
    count[x]++
  } else {
    count[x] = 1
  }

  return count
}, {})

export const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }

  return a
}
