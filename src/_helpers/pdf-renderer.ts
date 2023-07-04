import { jsPDF } from 'jspdf';

type PdfInput = {
  element?: string | HTMLElement;
  name?: string;
  images?: HTMLCanvasElement[];
  orientation?: 'p' | 'l';
  callback?: (data?: string) => void;
  inWindow?: boolean;
  noDownload?: boolean;
  pdf?: jsPDF;
  size?: 'a4' | 'us' | undefined;
};

// the required resolution for an A4-sized image is 1240 x 1754 pixels at 150 ppi (pixels per inch)
// 150 ppi is a default for jsPDF renderer
// PAGE_IMG_WIDTH = 1240;
// PAGE_IMG_HEIGHT = 1754;

// the required resolution for an US-Letter-sized image is 1275 x 1648 pixels at 150 ppi (pixels per inch)
// 150 ppi is a default for jsPDF renderer
// PAGE_IMG_WIDTH = 1275;
// PAGE_IMG_HEIGHT = 1648;

export function getPageImgSize(size = '') {
  const PAGE_IMG_WIDTH_US = 1275;
  const PAGE_IMG_WIDTH_A4 = 1240;
  const PAGE_IMG_HEIGHT_US = 1648;
  const PAGE_IMG_HEIGHT_A4 = 1754;
  return {
    width: size === 'a4' ? PAGE_IMG_WIDTH_A4 : PAGE_IMG_WIDTH_US,
    height: size === 'a4' ? PAGE_IMG_HEIGHT_A4 : PAGE_IMG_HEIGHT_US,
  };
}

export const MAIN_INFO_PART = 0.55;

export default function rendererPdf(data: PdfInput) {
  // we want US-Letter in mm units 216x279 as default, or A4 210x297 if given
  const PAGE_WIDTH_MM = data.size === 'a4' ? 210 : 216;
  const PAGE_HEIGHT_MM = data.size === 'a4' ? 297 : 279;
  const hasPdf = runRenderPdf(data, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
  if (!hasPdf && data.callback) {
    data.callback();
  }
}

export function rendererCardPdf(data: PdfInput) {
  // visa/master/business cards have standard size
  data.orientation = data.orientation ? data.orientation : 'l';
  const hasPdf = runRenderPdf(data, 54, 86);
  if (!hasPdf && data.callback) {
    data.callback();
  }
}

function runRenderPdf(data: PdfInput, widthMM: number, heightMM: number) {
  const size = data.orientation === 'l' ? [heightMM, widthMM] : [widthMM, heightMM];
  let pdf = new jsPDF(data.orientation, 'mm', size, true);
  if (data.element) {
    pdf.html(data.element, {
      autoPaging: false,
      callback: () => returnPDF({ pdf, name: data.name, inWindow: data.inWindow, callback: data.callback }),
    });
    return true;
  } else if (Array.isArray(data.images) && data.images.length) {
    data.images.forEach((canvas, index) => {
      canvas.getContext('2d');
      // we make spaces on sides of 1mm
      // this is why width of image should be -2mm, height -2mm too
      const displace = data.size === 'a4' ? 4 : 2;
      const o = data.orientation ? data.orientation : 'p';
      const w = o === 'p' ? widthMM - displace : heightMM - displace;
      const h = o === 'l' ? widthMM - displace : heightMM - displace;
      pdf.addImage(canvas, 'JPEG', 1, 1, w, h);
      const pageNumber = index + 1;
      if (Array.isArray(data.images) && pageNumber < data.images.length) {
        pdf.addPage();
        pdf.setPage(pageNumber + 1);
      }
    });
    returnPDF({ pdf, name: data.name, inWindow: data.inWindow, callback: data.callback });
    return true;
  }
  return false;
}

function returnPDF(data: PdfInput) {
  if (data.pdf) {
    if (data.inWindow) {
      const blobPDF = new Blob([data.pdf.output('blob')], { type: 'application/pdf' });
      window.location.href = URL.createObjectURL(blobPDF);
    } else if (data.noDownload) {
      const pdfBase64 = data.pdf.output('datauristring', { filename: `${data.name}.pdf` });
      if (data.callback) {
        data.callback(pdfBase64);
      }
    } else {
      data.pdf.save(`${data.name}.pdf`);
    }
  }
  if (data.callback) {
    data.callback();
  }
}
