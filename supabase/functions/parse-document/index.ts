import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple PDF text extraction (basic approach for common PDFs)
function extractTextFromPDF(data: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(data);
    
    // Extract text between stream/endstream markers (common PDF text encoding)
    const textBlocks: string[] = [];
    
    // Look for text in PDF streams
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    while ((match = streamRegex.exec(text)) !== null) {
      const content = match[1];
      // Try to extract readable text
      const readable = content
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (readable.length > 10) {
        textBlocks.push(readable);
      }
    }
    
    // Also look for text in parentheses (PDF string literals)
    const textStrings: string[] = [];
    const stringRegex = /\(([^)]+)\)/g;
    while ((match = stringRegex.exec(text)) !== null) {
      const str = match[1].replace(/\\./g, ' ').trim();
      if (str.length > 2 && /[a-zA-Z]{2,}/.test(str)) {
        textStrings.push(str);
      }
    }
    
    // Combine extracted text
    const combined = [...textBlocks, ...textStrings.join(' ')].join('\n');
    
    // Clean up the result
    const cleaned = combined
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, '')
      .trim();
    
    return cleaned.slice(0, 15000); // Limit to 15k chars
  } catch (e) {
    console.error('PDF extraction error:', e);
    return '';
  }
}

// Extract text from DOCX (simplified - looks for text in XML)
function extractTextFromDOCX(data: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(data);
    
    // DOCX files contain XML with <w:t> tags for text
    const textParts: string[] = [];
    const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        textParts.push(match[1]);
      }
    }
    
    // If no w:t tags found, try generic XML text extraction
    if (textParts.length === 0) {
      const genericRegex = />([^<]+)</g;
      while ((match = genericRegex.exec(text)) !== null) {
        const content = match[1].trim();
        if (content.length > 2 && /[a-zA-Z]{2,}/.test(content)) {
          textParts.push(content);
        }
      }
    }
    
    return textParts.join(' ').slice(0, 15000);
  } catch (e) {
    console.error('DOCX extraction error:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileData, fileName, mimeType } = await req.json();

    if (!fileData) {
      return new Response(
        JSON.stringify({ error: 'No file data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Parsing document: ${fileName} (${mimeType})`);

    // Decode base64 to bytes
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let extractedText = '';

    if (mimeType === 'application/pdf') {
      extractedText = extractTextFromPDF(bytes);
    } else if (
      mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      extractedText = extractTextFromDOCX(bytes);
    } else {
      // Try generic text extraction
      const decoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = decoder.decode(bytes).slice(0, 15000);
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\r]/g, '')
      .trim();

    console.log(`✅ Extracted ${extractedText.length} characters from ${fileName}`);

    return new Response(
      JSON.stringify({ 
        text: extractedText || null,
        fileName,
        charCount: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Document parsing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to parse document' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
