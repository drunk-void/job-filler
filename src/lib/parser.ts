import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Use Vite's URL handling to load the worker script locally
// This is essential for Manifest V3 extensions as they block external scripts
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Extracts text from a PDF file.
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Robustly extract text from items, skipping non-text items
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return (item as any).str;
          }
          return '';
        })
        .filter((str) => str.trim().length > 0)
        .join(' ');
        
      fullText += pageText + '\n\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('No text content found in PDF. It might be scanned or image-only.');
    }
    
    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    if (error instanceof Error) {
      throw new Error(`PDF Parsing Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while parsing the PDF.');
  }
};


/**
 * Extracts text from a DOCX file using mammoth.
 */
const extractTextFromDOCX = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Extracts text from a Markdown (plain text) file.
 */
const extractTextFromMD = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Main entry point for extracting text from supported file types.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return extractTextFromPDF(file);
    case 'docx':
      return extractTextFromDOCX(file);
    case 'md':
    case 'markdown':
    case 'txt':
      return extractTextFromMD(file);
    default:
      // If we can't determine by extension, try by type
      if (file.type === 'application/pdf') {
        return extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractTextFromDOCX(file);
      } else if (file.type === 'text/markdown' || file.type === 'text/plain') {
        return extractTextFromMD(file);
      }
      throw new Error(`Unsupported file type: ${file.name}`);
  }
};

/**
 * Converts a PDF file into an array of base64 JPEG images (one per page).
 * Used for OpenAI's Vision API since it does not support native PDF upload in chat completions.
 */
export const convertPDFToImages = async (file: File): Promise<string[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const images: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR by AI
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      } as any).promise;
      
      // Convert to base64 JPEG (lighter than PNG)
      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    
    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Failed to convert PDF to images for OpenAI processing.');
  }
};
