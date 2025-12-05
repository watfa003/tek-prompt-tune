import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Use AI to extract text from document (works better for compressed/encoded PDFs)
async function extractWithAI(base64Data: string, fileName: string, mimeType: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return '';
  }

  try {
    // For PDFs and documents, ask AI to describe/extract the content
    const isImage = mimeType.startsWith('image/');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ALL text content from this document (${fileName}). Return ONLY the extracted text, preserving the original structure, headings, paragraphs, and formatting as much as possible. Do not add any commentary, just the document text content.`
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI extraction failed:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';
    console.log(`✅ AI extracted ${extractedText.length} chars from ${fileName}`);
    return extractedText;
  } catch (e) {
    console.error('AI extraction error:', e);
    return '';
  }
}

// Fallback: Extract text from DOCX (simplified - looks for text in XML)
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

    let extractedText = '';

    // Use AI for PDF extraction (handles compression properly)
    if (mimeType === 'application/pdf') {
      console.log('📋 Using AI to extract PDF content...');
      extractedText = await extractWithAI(fileData, fileName, mimeType);
    } else if (
      mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Decode base64 to bytes for DOCX
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      extractedText = extractTextFromDOCX(bytes);
      
      // If DOCX extraction fails, try AI
      if (!extractedText || extractedText.length < 50) {
        console.log('📋 DOCX extraction weak, trying AI...');
        extractedText = await extractWithAI(fileData, fileName, mimeType);
      }
    } else {
      // Try generic text extraction for other formats
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = decoder.decode(bytes).slice(0, 15000);
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`✅ Final extracted ${extractedText.length} characters from ${fileName}`);
    console.log(`📝 Preview: ${extractedText.substring(0, 200)}...`);

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
