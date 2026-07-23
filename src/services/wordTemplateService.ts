import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';

export interface CheckTemplateData {
  check_number: string;
  date: string;
  payee: string;
  amount: string;
  amount_in_words: string;
  bank_name: string;
  memo: string;
  voucher_number?: string;
  department?: string;
  company_name?: string;
  [key: string]: string | undefined;
}

/**
 * Extracts potential tag placeholders like {{tag}}, {tag}, or [tag] from a Word .docx file
 */
export const extractTagsFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string[]> => {
  try {
    const zip = new PizZip(arrayBuffer);
    const documentXml = zip.files['word/document.xml']?.asText();
    if (!documentXml) return [];

    // Strip out XML tags to avoid matching across split XML tags in Word
    const textOnly = documentXml.replace(/<[^>]+>/g, '');
    
    // Match {{tag}}, {tag}, or [tag]
    const tagRegex = /\{\{([^}]+)\}\}|\{([^}]+)\}|\[([^\]]+)\]/g;
    const tags = new Set<string>();
    let match;

    while ((match = tagRegex.exec(textOnly)) !== null) {
      const foundTag = (match[1] || match[2] || match[3]).trim();
      if (foundTag && foundTag.length < 50 && !foundTag.includes('<') && !foundTag.includes('>')) {
        tags.add(foundTag);
      }
    }

    return Array.from(tags);
  } catch (error) {
    console.error('Failed to extract tags from DOCX:', error);
    return [];
  }
};

/**
 * Clean up Word split XML tags inside tag delimiters and normalize {tag} or [tag] to {{tag}}
 */
const normalizeDocxXml = (xmlContent: string): string => {
  if (!xmlContent) return xmlContent;

  let cleaned = xmlContent;

  // 1. Remove XML tag breaks between opening and closing braces
  // e.g. {{</w:t></w:r><w:r><w:t>payee}}
  cleaned = cleaned.replace(/\{\{\s*<\/w:t>[\s\S]*?<w:t[^>]*>\s*/g, '{{');
  cleaned = cleaned.replace(/\s*<\/w:t>[\s\S]*?<w:t[^>]*>\s*\}\}/g, '}}');

  // 2. Convert single braces {tag} to {{tag}} if not already double
  cleaned = cleaned.replace(/([^{])\{([^{}\n\r]+)\}([^{])/g, '$1{{$2}}$3');

  // 3. Convert brackets [tag] to {{tag}}
  cleaned = cleaned.replace(/\[([a-zA-Z0-9_\-\s]+)\]/g, '{{$1}}');

  return cleaned;
};

/**
 * Fills Word .docx template placeholders with supplied check data using docxtemplater
 */
export const fillDocxTemplate = (
  templateArrayBuffer: ArrayBuffer,
  checkData: CheckTemplateData,
  customMappings?: Record<string, string>
): ArrayBuffer => {
  try {
    const zip = new PizZip(templateArrayBuffer);

    // Pre-process word/document.xml to unify tag syntax & clean split tags
    const docXml = zip.files['word/document.xml']?.asText();
    if (docXml) {
      const normalizedXml = normalizeDocxXml(docXml);
      zip.file('word/document.xml', normalizedXml);
    }

    // Combine standard keys with uppercase / capitalized alias variations
    const basePayload: Record<string, string> = {
      // Standard exact keys
      check_number: checkData.check_number || '',
      date: checkData.date || '',
      payee: checkData.payee || '',
      amount: checkData.amount || '',
      amount_in_words: checkData.amount_in_words || '',
      bank_name: checkData.bank_name || '',
      memo: checkData.memo || '',
      voucher_number: checkData.voucher_number || '',
      department: checkData.department || '',
      company_name: checkData.company_name || '',

      // Common camelCase / TitleCase aliases
      checkNumber: checkData.check_number || '',
      bankName: checkData.bank_name || '',
      amountInWords: checkData.amount_in_words || '',
      voucherNumber: checkData.voucher_number || '',
      Payee: checkData.payee || '',
      Date: checkData.date || '',
      Amount: checkData.amount || '',
      Memo: checkData.memo || '',
      CHECK_NUMBER: checkData.check_number || '',
      DATE: checkData.date || '',
      PAYEE: checkData.payee || '',
      AMOUNT: checkData.amount || '',
      AMOUNT_IN_WORDS: checkData.amount_in_words || '',
      BANK_NAME: checkData.bank_name || '',
      MEMO: checkData.memo || ''
    };

    // Apply custom field mapping overrides
    if (customMappings) {
      Object.entries(customMappings).forEach(([customTag, targetDataKey]) => {
        if (targetDataKey && basePayload[targetDataKey] !== undefined) {
          basePayload[customTag] = basePayload[targetDataKey];
          basePayload[customTag.trim()] = basePayload[targetDataKey];
        }
      });
    }

    // Wrap payload in Proxy for safe fallback on any unknown tag
    const safePayload = new Proxy(basePayload, {
      get(target, prop: string) {
        if (typeof prop === 'string') {
          if (prop in target) return target[prop];
          const lower = prop.toLowerCase().trim();
          for (const key of Object.keys(target)) {
            if (key.toLowerCase() === lower) return target[key];
          }
        }
        return '';
      }
    });

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      nullGetter() {
        return '';
      }
    });

    doc.render(safePayload);
    const outputZip = doc.getZip();
    return outputZip.generate({ type: 'arraybuffer' });
  } catch (error: any) {
    console.error('Error rendering Docx template:', error);
    throw new Error(error?.message || 'Failed to fill Word template tags. Please verify template file format.');
  }
};

/**
 * Converts populated .docx ArrayBuffer to clean HTML for live browser preview & printing
 */
export const convertDocxToHtml = async (docxArrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer: docxArrayBuffer });
    return result.value || '<p class="text-gray-400 italic">Empty Word Document Template</p>';
  } catch (error) {
    console.error('Error converting DOCX to HTML:', error);
    return '<p class="text-red-500 font-semibold">Unable to parse Word document visual layout.</p>';
  }
};

/**
 * Helper to download filled Word document file in browser
 */
export const downloadDocxBlob = (arrayBuffer: ArrayBuffer, fileName: string) => {
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Helper to create a fully compliant sample .docx arrayBuffer for instant testing
 */
export const createSampleWordCheckTemplate = (): ArrayBuffer => {
  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>DATE: {{date}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>PAY TO THE ORDER OF: {{payee}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>AMOUNT: {{amount}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:i/><w:sz w:val="24"/></w:rPr><w:t>PESOS: {{amount_in_words}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>CHECK NO: {{check_number}} | BANK: {{bank_name}} | MEMO: {{memo}}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zip = new PizZip();
  zip.file('word/document.xml', content);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
</Relationships>`);
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  return zip.generate({ type: 'arraybuffer' });
};

