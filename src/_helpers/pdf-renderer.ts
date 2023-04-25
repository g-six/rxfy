import { jsPDF } from 'jspdf';

type PdfInput = {
  element?: string | HTMLElement;
  name?: string;
  images?: HTMLCanvasElement[];
  orientation?: 'p' | 'l';
  callback?: () => {};
  inWindow?: boolean;
  pdf?: jsPDF;
};

// the required resolution for an A4-sized image is 1240 x 1754 pixels at 150 ppi (pixels per inch)
// 150 ppi is a default for jsPDF renderer
export const PAGE_IMG_WIDTH = 1240;
export const PAGE_IMG_HEIGHT = 1754;

export default function rendererPdf(data: PdfInput) {
  let pdf = new jsPDF(data.orientation, 'mm', 'a4', true); // we will A4 in mm units
  if (data.element) {
    pdf.html(data.element, {
      autoPaging: false,
      callback: () => returnPDF({ pdf, name: data.name, inWindow: data.inWindow, callback: data.callback }),
    });
  } else if (Array.isArray(data.images) && data.images.length) {
    data.images.forEach((canvas, index) => {
      canvas.getContext('2d');
      const imageOfPage = canvas.toDataURL('image/jpeg', 1.0);
      // A4 page size in mm is 210x297, and we make spaces on sides of 1mm
      // this is why width of image should be 208mm, height 295mm
      const o = data.orientation ? data.orientation : 'p';
      const w = o === 'p' ? 208 : 295;
      const h = o === 'l' ? 208 : 295;
      pdf.addImage(canvas, 'JPEG', 1, 1, w, h);
      const pageNumber = index + 1;
      if (Array.isArray(data.images) && pageNumber < data.images.length) {
        pdf.addPage();
        pdf.setPage(pageNumber + 1);
      }
    });
    returnPDF({ pdf, name: data.name, inWindow: data.inWindow, callback: data.callback });
  } else if (data.callback) {
    data.callback();
  }
}

function returnPDF(data: PdfInput) {
  if (data.pdf) {
    if (data.inWindow) {
      const blobPDF = new Blob([data.pdf.output('blob')], { type: 'application/pdf' });
      window.location.href = URL.createObjectURL(blobPDF);
    } else {
      data.pdf.save(`${data.name}.pdf`);
    }
  }
  if (data.callback) {
    data.callback();
  }
}
