// Easing fns
// t: current time, b: begInnIng value, c: target value, d: duration

export const linearSmooth = (t, b, c, d) => (t / d) * c + b
export const easeOutCubic = (t, b, c, d) =>
  c * ((t = t / d - 1) * t * t + 1) + b
export const easeOutSine = (t, b, c, d) =>
  c * Math.sin((t / d) * (Math.PI / 2)) + b

export const smoothScroll = (element, position, duration, easingFn) => {
  let originalPosition = element.scrollTop
  let dx = position - element.scrollTop
  let startTime = performance.now()

  let scroll = () => {
    let dt = performance.now() - startTime

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
