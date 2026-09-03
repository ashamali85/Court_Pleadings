import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import type { Placeholders } from '@/lib/templates/types'

/**
 * Fills the office's own .docx with the request's values. The template keeps
 * its fonts, RTL layout, header table and footer — only the {placeholders}
 * change, so the output is the same document the lawyer already uses.
 */
export function renderDocx(
  templateBytes: Uint8Array,
  data: Placeholders,
): Uint8Array<ArrayBuffer> {
  const zip = new PizZip(Buffer.from(templateBytes))

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true, // lets an excluded demand remove its whole paragraph
    linebreaks: true, // multi-line client input stays multi-line in Word
    nullGetter: () => '',
  })

  try {
    doc.render(data as Record<string, unknown>)
  } catch (error: unknown) {
    const e = error as { properties?: { errors?: { properties?: { explanation?: string } }[] } }
    const explanations =
      e.properties?.errors
        ?.map((err) => err.properties?.explanation)
        .filter(Boolean)
        .join(' | ') ?? ''
    throw new Error(
      `تعذر إنشاء المستند من القالب${explanations ? `: ${explanations}` : ''}`,
    )
  }

  // copied into a fresh ArrayBuffer: Prisma 7's Bytes field is
  // Uint8Array<ArrayBuffer>, which a Node Buffer (ArrayBufferLike) does not satisfy
  const generated: Buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  })
  return new Uint8Array(generated)
}
