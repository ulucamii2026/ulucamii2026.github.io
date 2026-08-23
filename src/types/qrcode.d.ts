declare module "qrcode" {
  const qr: { toDataURL(text: string, opts?: Record<string, unknown>): Promise<string>; toString(text: string, opts?: Record<string, unknown>): Promise<string> };
  export default qr;
}
