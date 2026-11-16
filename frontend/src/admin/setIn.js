// Set a value deep inside an object by path, e.g. ['hero', 'title'], returning a new object.
export function setIn(object, path, value) {
  if (!path.length) return value
  const [key, ...rest] = path
  const copy = Array.isArray(object) ? [...object] : { ...object }
  copy[key] = setIn(object?.[key], rest, value)
  return copy
}
