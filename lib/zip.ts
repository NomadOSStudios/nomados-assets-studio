// ZIP's STORE method avoids recompressing already-compressed PNGs.
const encoder = new TextEncoder();
const table = Uint32Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function header(size: number) {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
}
export async function createZip(
  files: { name: string; data: Blob | string }[],
) {
  const parts: BlobPart[] = [],
    central: BlobPart[] = [];
  let offset = 0,
    centralSize = 0;
  for (const file of files) {
    const name = encoder.encode(file.name),
      data =
        typeof file.data === "string"
          ? encoder.encode(file.data)
          : new Uint8Array(await file.data.arrayBuffer()),
      sum = crc(data);
    const h = header(30);
    h.view.setUint32(0, 0x04034b50, true);
    h.view.setUint16(4, 20, true);
    h.view.setUint16(6, 0x800, true);
    h.view.setUint16(12, 0x21, true);
    h.view.setUint32(14, sum, true);
    h.view.setUint32(18, data.length, true);
    h.view.setUint32(22, data.length, true);
    h.view.setUint16(26, name.length, true);
    parts.push(h.bytes, name, data);
    const c = header(46);
    c.view.setUint32(0, 0x02014b50, true);
    c.view.setUint16(4, 20, true);
    c.view.setUint16(6, 20, true);
    c.view.setUint16(8, 0x800, true);
    c.view.setUint16(14, 0x21, true);
    c.view.setUint32(16, sum, true);
    c.view.setUint32(20, data.length, true);
    c.view.setUint32(24, data.length, true);
    c.view.setUint16(28, name.length, true);
    c.view.setUint32(42, offset, true);
    central.push(c.bytes, name);
    centralSize += 46 + name.length;
    offset += 30 + name.length + data.length;
  }
  const end = header(22);
  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(8, files.length, true);
  end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.bytes], {
    type: "application/zip",
  });
}
