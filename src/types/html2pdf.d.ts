declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      letterRendering?: boolean;
      scrollX?: number;
      scrollY?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string | number[];
      orientation?: "portrait" | "landscape";
      compress?: boolean;
    };
    pagebreak?: { mode?: string | string[]; before?: string; after?: string; avoid?: string };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement | string): Html2PdfWorker;
    save(): Promise<void>;
    output(type?: string, options?: object): Promise<unknown>;
    outputImg(type?: string): Promise<unknown>;
    then(fn: (worker: Html2PdfWorker) => void): Html2PdfWorker;
    catch(fn: (err: Error) => void): Html2PdfWorker;
  }

  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfWorker;

  export = html2pdf;
}
