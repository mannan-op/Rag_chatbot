import { PDFParse } from "pdf-parse";

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export type ExtractedPdf = {
  totalPages: number;
  pages: ExtractedPage[];
};

export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdf> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    stopAtErrors: true,
  });

  try {
    const result = await parser.getText({
      pageJoiner: "",
    });

    return {
      totalPages: result.total,
      pages: result.pages.map((page) => ({
        pageNumber: page.num,
        text: page.text,
      })),
    };
  } finally {
    await parser.destroy();
  }
}
