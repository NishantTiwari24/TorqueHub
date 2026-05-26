export function parseTemplate(template) {
  const bodyMatch = template.match(/<body([^>]*)>([\s\S]*)<\/body>/i)
  const bodyAttrs = bodyMatch?.[1] ?? ''
  const bodyContent = bodyMatch?.[2] ?? template
  const classMatch = bodyAttrs.match(/class\s*=\s*"([^"]*)"/i)
  const bodyClassName = classMatch?.[1] ?? ''

  return { bodyContent, bodyClassName }
}
