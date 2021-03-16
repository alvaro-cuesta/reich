// Easing fns
// t: current time, b: begInnIng value, c: target value, d: duration

export const linearSmooth = (t, b, c, d) => (t / d) * c + b
export const easeOutCubic = (t, b, c, d) =>
  c * ((t = t / d - 1) * t * t + 1) + b
export const easeOutSine = (t, b, c, d) =>
  c * Math.sin((t / d) * (Math.PI / 2)) + b

export const smoothScroll = (element, position, duration, easingFn) => {
  const originalPosition = element.scrollTop
  const dx = position - element.scrollTop
  const startTime = performance.now()

  const scroll = () => {
    const dt = performance.now() - startTime

    if (dt > duration) {
      element.scrollTop = position
      return
    }

    element.scrollTop = easingFn(dt, originalPosition, dx, duration)

    requestAnimationFrame(scroll)
  }

  requestAnimationFrame(scroll)
}

export default smoothScroll
