type Handler = () => void
let handler: Handler | null = null
export function onUnauthorized(fn: Handler): void { handler = fn }
export function emitUnauthorized(): void { handler?.() }