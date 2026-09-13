declare module "tesseract.js/dist/tesseract.min.js" {
  interface Worker {
    recognize(image: string): Promise<{
      data: {
        text: string;
        confidence: number;
      };
    }>;
    terminate(): Promise<unknown>;
  }

  interface TesseractBrowser {
    createWorker(langs?: string): Promise<Worker>;
  }

  const tesseract: TesseractBrowser;

  export default tesseract;
}
