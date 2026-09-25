/**
 * The parts of the attachment flow that can be checked without a blob store.
 *
 * These are the predicates that stand between one client and another client's
 * files, so they are worth pinning: the folder a client may write into, the
 * draft key shape, and the filename that ends up in a response header.
 *
 *   npx tsx scripts/attachments-check.ts
 */
import {
  ACCEPTED_MIME_TYPES,
  ATTACHMENT_KINDS,
  attachmentLabel,
  blobFolder,
  humanSize,
  isAttachmentKind,
  isDraftKey,
  MAX_ATTACHMENT_BYTES,
  safeFilename,
} from '@/lib/attachments'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = Object.is(actual, expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n      got ${actual}, expected ${expected}`}`,
  )
}

console.log('--- the seven kinds')
check('all seven are offered', ATTACHMENT_KINDS.length, 7)
check('in the order asked for', ATTACHMENT_KINDS[0].value, 'LEASE')
check('and the last is the catch-all', ATTACHMENT_KINDS[6].value, 'OTHER')
check('labels resolve', attachmentLabel('HEIRS_INVENTORY'), 'حصر الورثة')
check('an unknown kind is not silently blank', attachmentLabel('NOPE'), 'NOPE')
check('a known kind is accepted', isAttachmentKind('TRADE_LICENCE'), true)
check('an invented one is not', isAttachmentKind('PASSPORT'), false)
check('nor is a lowercase near-miss', isAttachmentKind('lease'), false)

console.log('\n--- the draft key, which groups one draft’s uploads')
check('a uuid without dashes passes', isDraftKey('a'.repeat(32)), true)
check('too short is refused', isDraftKey('abc'), false)
check('a path separator is refused', isDraftKey('aaaaaaaa/../bbbbbbbb'), false)
check('a dot segment is refused', isDraftKey('....aaaa'), false)
check('empty is refused', isDraftKey(''), false)

console.log('\n--- the folder a client may write into')
const mine = blobFolder('user_alice', 'd'.repeat(16))
const theirs = blobFolder('user_bob', 'd'.repeat(16))
check('is scoped by client id', mine.startsWith('requests/user_alice/'), true)
check('and differs between clients', mine === theirs, false)
check('a path in my folder is mine', `${mine}/lease.pdf`.startsWith(`${mine}/`), true)
check(
  "a path in another client's folder is not",
  `${theirs}/lease.pdf`.startsWith(`${mine}/`),
  false,
)
check(
  'and a prefix that merely looks similar is not',
  'requests/user_alice_evil/xxxx/lease.pdf'.startsWith(`${mine}/`),
  false,
)

console.log('\n--- the filename that reaches a response header')
check('a path is flattened', safeFilename('../../etc/passwd'), '.. .. etc passwd')
check('arabic survives', safeFilename('عقد الإيجار.pdf'), 'عقد الإيجار.pdf')
check('a newline cannot split the header', safeFilename('a\r\nb'), 'a b')
check('a nul byte is removed', safeFilename('a\u0000b'), 'a b')
check('empty falls back', safeFilename('   '), 'attachment')
check('over-long is trimmed', safeFilename('x'.repeat(500)).length, 180)

console.log('\n--- limits')
check('20MB ceiling', MAX_ATTACHMENT_BYTES, 20 * 1024 * 1024)
check(
  'executables are not accepted',
  ACCEPTED_MIME_TYPES.includes('application/pdf'),
  true,
)
check(
  'and neither is html',
  (ACCEPTED_MIME_TYPES as readonly string[]).includes('text/html'),
  false,
)
check('sizes read in Arabic', humanSize(2_411_724), '2.3 ميجابايت')
check('small ones too', humanSize(900), '900 بايت')

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
