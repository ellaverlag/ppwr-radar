declare module "html-to-docx" {
  export default function HTMLtoDOCX(
    html: string,
    header?: string | null,
    options?: Record<string, unknown>
  ): Promise<Buffer | ArrayBuffer | Blob>;
}

declare module "pdfmake/build/pdfmake.js" {
  interface PdfDocument {
    getBuffer(cb: (buffer: Uint8Array) => void): void;
  }
  interface PdfMakeStatic {
    vfs: Record<string, string> | undefined;
    createPdf(docDefinition: Record<string, unknown>): PdfDocument;
  }
  const pdfMake: PdfMakeStatic;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts.js" {
  const fonts: {
    vfs?: Record<string, string>;
    pdfMake?: { vfs: Record<string, string> };
  };
  export default fonts;
}
