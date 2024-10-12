export function capitalizeFirst(str: string, allCapsMax = 0) {
  if (str.length <= allCapsMax) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function miniMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
}

export function ucFirst(str: string) {
  return str.split(' ').map(s =>
    `${s.slice(0, 1).toLocaleUpperCase()}${s.slice(1)}`
  ).join(' ');
}

export function paragraphize(txt: string, pclass: string = '') {
  const classtxt = pclass ? ` class="${pclass}"` : '';
  return `<p${classtxt}>${txt.split('\n\n').join(`</p><p${classtxt}>`)}</p>`;
}

export async function zip(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  const compressedStream = new CompressionStream('deflate');
  const writer = compressedStream.writable.getWriter();
  writer.write(data);
  writer.close();

  const compressedArrayBuffer = await new Response(compressedStream.readable).arrayBuffer();
  const compressedUint8Array = new Uint8Array(compressedArrayBuffer);
  
  return toUrlSafeBase64(btoa(String.fromCharCode(...compressedUint8Array)));
}

export async function unzip(compressedString: string) {
  const compressedUint8Array = new Uint8Array(
    atob(fromUrlSafeBase64(compressedString)).split("").map(c => c.charCodeAt(0))
  );
  
  const decompressedStream = new DecompressionStream('deflate');
  const writer = decompressedStream.writable.getWriter();
  writer.write(compressedUint8Array);
  writer.close();

  const decompressedArrayBuffer = await new Response(decompressedStream.readable).arrayBuffer();
  const decoder = new TextDecoder();
  return decoder.decode(decompressedArrayBuffer);
}

function toUrlSafeBase64(base64String: string) {
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(urlSafeBase64String: string) {
  let base64String = urlSafeBase64String.replace(/-/g, '+').replace(/_/g, '/');
  while (base64String.length % 4) {
    base64String += '=';
  }
  return base64String;
}