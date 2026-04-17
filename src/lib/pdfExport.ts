const CDN_HTML2CANVAS =
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const CDN_JSPDF =
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - 2 * MARGIN_MM;
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * MARGIN_MM;
const BLOCK_GAP_MM = 6;

type Html2CanvasFn = (
  el: HTMLElement,
  opts: Record<string, unknown>
) => Promise<HTMLCanvasElement>;

type JsPDFConstructor = new (opts: Record<string, unknown>) => {
  addPage: () => void;
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => void;
  save: (name: string) => void;
  internal: { pageSize: { getHeight: () => number } };
};

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Skript konnte nicht geladen werden: ${src}`));
    document.head.appendChild(script);
  });
}

async function waitForChartCanvases(root: HTMLElement): Promise<void> {
  const canvases = root.querySelectorAll('canvas');
  if (canvases.length === 0) return;
  await new Promise(resolve => setTimeout(resolve, 1500));
}

interface BlockCapture {
  canvas: HTMLCanvasElement;
  imageData: string;
  blockWidthPx: number;
  blockHeightPx: number;
}

async function captureBlock(
  block: HTMLElement,
  html2canvas: Html2CanvasFn
): Promise<BlockCapture> {
  const blockWidthPx = block.scrollWidth;
  const blockHeightPx = block.scrollHeight;

  const canvas = await html2canvas(block, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    width: blockWidthPx,
    height: blockHeightPx,
    windowWidth: blockWidthPx,
    windowHeight: blockHeightPx,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  const imageData = canvas.toDataURL('image/jpeg', 0.92);

  return { canvas, imageData, blockWidthPx, blockHeightPx };
}

interface PlacedBlock {
  imageData: string;
  widthMm: number;
  heightMm: number;
  xMm: number;
}

function computePlacement(
  capture: BlockCapture,
  parentWidthPx: number
): PlacedBlock {
  const scaleRatio = CONTENT_WIDTH_MM / parentWidthPx;
  const widthMm = capture.blockWidthPx * scaleRatio;
  const heightMm = capture.blockHeightPx * scaleRatio;
  const xMm = MARGIN_MM + (CONTENT_WIDTH_MM - widthMm) / 2;

  return {
    imageData: capture.imageData,
    widthMm,
    heightMm,
    xMm,
  };
}

function addBlockToPage(
  pdf: InstanceType<JsPDFConstructor>,
  placed: PlacedBlock,
  cursorMm: number,
  isFirstBlock: boolean
): number {
  const gapBefore = isFirstBlock ? 0 : BLOCK_GAP_MM;
  const neededMm = gapBefore + placed.heightMm;

  const blockFitsOnCurrentPage = cursorMm + neededMm <= CONTENT_HEIGHT_MM;
  const blockIsOversized = placed.heightMm > CONTENT_HEIGHT_MM;

  if (!blockFitsOnCurrentPage && !blockIsOversized) {
    pdf.addPage();
    cursorMm = 0;
  } else {
    cursorMm += gapBefore;
  }

  if (blockIsOversized) {
    if (cursorMm > 0) {
      pdf.addPage();
      cursorMm = 0;
    }

    const totalHeightMm = placed.heightMm;
    let remainingMm = totalHeightMm;
    let sliceOffsetMm = 0;

    while (remainingMm > 0) {
      if (sliceOffsetMm > 0) pdf.addPage();

      const yOffsetMm = MARGIN_MM - sliceOffsetMm;

      pdf.addImage(
        placed.imageData,
        'JPEG',
        placed.xMm,
        yOffsetMm,
        placed.widthMm,
        totalHeightMm
      );

      const consumed = Math.min(CONTENT_HEIGHT_MM, remainingMm);
      sliceOffsetMm += consumed;
      remainingMm -= consumed;
    }

    const lastPageUsed = totalHeightMm % CONTENT_HEIGHT_MM;
    return lastPageUsed === 0 ? CONTENT_HEIGHT_MM : lastPageUsed;
  }

  pdf.addImage(
    placed.imageData,
    'JPEG',
    placed.xMm,
    MARGIN_MM + cursorMm,
    placed.widthMm,
    placed.heightMm
  );

  return cursorMm + placed.heightMm;
}

export async function exportElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  await Promise.all([loadScript(CDN_HTML2CANVAS), loadScript(CDN_JSPDF)]);

  if ('fonts' in document) {
    await (document.fonts as FontFaceSet).ready;
  }

  await waitForChartCanvases(element);

  const html2canvas = (window as unknown as Record<string, unknown>)[
    'html2canvas'
  ] as Html2CanvasFn;

  const jspdf = (window as unknown as Record<string, unknown>)['jspdf'] as {
    jsPDF: JsPDFConstructor;
  };

  if (!html2canvas || !jspdf?.jsPDF) {
    throw new Error(
      'html2canvas oder jsPDF konnten nicht initialisiert werden.'
    );
  }

  const { jsPDF } = jspdf;

  const blocks = element.querySelectorAll<HTMLElement>('[data-pdf-block]');

  if (blocks.length === 0) {
    throw new Error(
      'Keine exportierbaren Blöcke gefunden (data-pdf-block fehlt).'
    );
  }

  const parentWidthPx = element.scrollWidth;

  const captures: BlockCapture[] = [];
  for (const block of blocks) {
    const capture = await captureBlock(block, html2canvas);
    captures.push(capture);
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  let cursorMm = 0;

  captures.forEach((capture, index) => {
    const placed = computePlacement(capture, parentWidthPx);
    cursorMm = addBlockToPage(pdf, placed, cursorMm, index === 0);
  });

  pdf.save(filename);
}
