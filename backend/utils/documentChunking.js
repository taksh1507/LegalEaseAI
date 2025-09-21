// Advanced Document Chunking for Large Legal Documents
// Handles 10+ page documents intelligently for AI analysis

/**
 * Advanced document chunking for large legal documents
 * Preserves context and legal structure while staying within AI token limits
 */
function intelligentDocumentChunking(documentText, maxChunkSize = 8000) {
  console.log(`📄 Starting intelligent chunking for ${documentText.length} character document...`);
  
  if (documentText.length <= maxChunkSize) {
    console.log('📄 Document fits in single chunk');
    return [documentText];
  }

  const chunks = [];
  const paragraphs = documentText.split(/\n\s*\n/).filter(p => p.trim().length > 10);
  
  console.log(`📄 Split document into ${paragraphs.length} paragraphs`);
  
  let currentChunk = '';
  let currentSize = 0;
  
  // Legal document structure markers for intelligent splitting
  const sectionMarkers = [
    /^ARTICLE\s+[IVX\d]+/i,
    /^SECTION\s+[\d\.]+/i,
    /^CLAUSE\s+[\d\.]+/i,
    /^\d+\.\s*[A-Z]/,
    /^[A-Z\s]{3,}:?\s*$/,
    /^WHEREAS/i,
    /^NOW THEREFORE/i,
    /^IN WITNESS WHEREOF/i
  ];
  
  // High-priority content that should always be included
  const criticalSections = [
    /termination/i,
    /liability/i,
    /payment/i,
    /breach/i,
    /confidential/i,
    /proprietary/i,
    /warranty/i,
    /indemnif/i,
    /governing law/i,
    /dispute resolution/i,
    /force majeure/i
  ];
  
  let chunkIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphSize = paragraph.length + 2; // +2 for newlines
    
    // Check if this paragraph starts a new legal section
    const isNewSection = sectionMarkers.some(marker => marker.test(paragraph));
    
    // Check if this is critical content
    const isCritical = criticalSections.some(pattern => pattern.test(paragraph));
    
    // If adding this paragraph would exceed the limit, finalize current chunk
    if (currentSize + paragraphSize > maxChunkSize && currentChunk.length > 0) {
      // Add section boundary marker if we're splitting mid-section
      if (!isNewSection) {
        currentChunk += '\n\n[SECTION CONTINUES...]';
      }
      
      chunks.push({
        index: chunkIndex,
        content: currentChunk.trim(),
        size: currentChunk.length,
        isCritical: criticalSections.some(pattern => pattern.test(currentChunk)),
        hasFinancialTerms: /\$[\d,]+/.test(currentChunk),
        hasDates: /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(currentChunk)
      });
      
      console.log(`📄 Created chunk ${chunkIndex} (${currentChunk.length} chars)`);
      chunkIndex++;
      currentChunk = '';
      currentSize = 0;
      
      // If we're starting a new section, add context from previous chunk
      if (isNewSection && chunks.length > 0) {
        const previousChunk = chunks[chunks.length - 1].content;
        const lastSentences = previousChunk.split('.').slice(-2).join('.');
        currentChunk = '[...CONTINUED FROM PREVIOUS SECTION]\n' + lastSentences + '\n\n';
        currentSize = currentChunk.length;
      }
    }
    
    // Add the paragraph to current chunk
    currentChunk += paragraph + '\n\n';
    currentSize += paragraphSize;
    
    // If this is critical content and we're near the limit, prioritize it
    if (isCritical && currentSize > maxChunkSize * 0.8) {
      console.log(`📄 Prioritizing critical content in chunk ${chunkIndex}`);
    }
  }
  
  // Add the final chunk if there's content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      index: chunkIndex,
      content: currentChunk.trim(),
      size: currentChunk.length,
      isCritical: criticalSections.some(pattern => pattern.test(currentChunk)),
      hasFinancialTerms: /\$[\d,]+/.test(currentChunk),
      hasDates: /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(currentChunk)
    });
    console.log(`📄 Created final chunk ${chunkIndex} (${currentChunk.length} chars)`);
  }
  
  console.log(`📄 Document split into ${chunks.length} intelligent chunks`);
  return chunks;
}

/**
 * Analyze large document using chunking strategy with Google Gemini
 */
async function analyzeLargeDocumentWithGemini(documentText, geminiModel) {
  console.log('📚 Analyzing large document with intelligent chunking...');
  
  const chunks = intelligentDocumentChunking(documentText, 5000); // Conservative limit for Gemini
  const analyses = [];
  
  // Analyze each chunk
  for (const chunk of chunks) {
    console.log(`🔍 Analyzing chunk ${chunk.index + 1}/${chunks.length} (${chunk.size} chars)...`);
    
    try {
      const chunkPrompt = `You are analyzing PART ${chunk.index + 1} of ${chunks.length} of a large legal document.

CHUNK CONTEXT:
- This is chunk ${chunk.index + 1} of ${chunks.length} total chunks
- Critical content: ${chunk.isCritical ? 'YES' : 'NO'}
- Contains financial terms: ${chunk.hasFinancialTerms ? 'YES' : 'NO'}  
- Contains dates: ${chunk.hasDates ? 'YES' : 'NO'}

ANALYSIS FOCUS FOR THIS CHUNK:
1. Identify any complete legal clauses or sections
2. Extract key obligations, rights, or restrictions
3. Note any financial terms, dates, or deadlines
4. Highlight critical legal language or unusual provisions
5. Indicate if this chunk connects to previous/next sections

DOCUMENT CHUNK:
${chunk.content}

Provide focused analysis of this specific chunk, noting its role in the overall document structure.`;

      const result = await geminiModel.generateContent(chunkPrompt);
      const response = await result.response;
      const chunkAnalysis = response.text();
      
      analyses.push({
        chunkIndex: chunk.index,
        size: chunk.size,
        isCritical: chunk.isCritical,
        analysis: chunkAnalysis,
        hasFinancialTerms: chunk.hasFinancialTerms,
        hasDates: chunk.hasDates
      });
      
      console.log(`✅ Chunk ${chunk.index + 1} analyzed successfully`);
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Failed to analyze chunk ${chunk.index + 1}:`, error.message);
      analyses.push({
        chunkIndex: chunk.index,
        size: chunk.size,
        isCritical: chunk.isCritical,
        analysis: `Analysis failed for this chunk: ${error.message}`,
        hasFinancialTerms: chunk.hasFinancialTerms,
        hasDates: chunk.hasDates
      });
    }
  }
  
  // Synthesize overall analysis
  console.log('🔄 Synthesizing overall document analysis...');
  
  const synthesisPrompt = `You are synthesizing analysis from ${analyses.length} chunks of a large legal document.

CHUNK ANALYSES:
${analyses.map(a => `
CHUNK ${a.chunkIndex + 1} (${a.size} chars, Critical: ${a.isCritical}):
${a.analysis}
---`).join('\n')}

SYNTHESIS REQUIREMENTS:
1. Create unified document summary from all chunks
2. Identify the overall document type and purpose
3. Compile all key parties, obligations, and terms
4. Highlight critical clauses found across chunks
5. Assess overall risk profile and concerns
6. Provide coherent executive summary

Provide comprehensive analysis that unifies insights from all document chunks.`;
  
  try {
    const synthesisResult = await geminiModel.generateContent(synthesisPrompt);
    const synthesisResponse = await synthesisResult.response;
    const overallAnalysis = synthesisResponse.text();
    
    console.log('✅ Document synthesis completed');
    
    return {
      overallAnalysis,
      chunkAnalyses: analyses,
      totalChunks: chunks.length,
      documentSize: documentText.length,
      processingMethod: 'Intelligent Chunking with Google Gemini'
    };
    
  } catch (error) {
    console.error('❌ Failed to synthesize document analysis:', error.message);
    
    // Fallback: combine chunk analyses manually
    const combinedAnalysis = analyses.map(a => a.analysis).join('\n\n');
    
    return {
      overallAnalysis: `Combined analysis from ${analyses.length} document chunks:\n\n${combinedAnalysis}`,
      chunkAnalyses: analyses,
      totalChunks: chunks.length,
      documentSize: documentText.length,
      processingMethod: 'Intelligent Chunking (Manual Synthesis)'
    };
  }
}

/**
 * Smart document size detection and routing
 */
function shouldUseChunking(documentText, maxSingleChunkSize = 8000) {
  const documentSize = documentText.length;
  const isLargeDocument = documentSize > maxSingleChunkSize;
  
  // Additional heuristics for legal documents
  const pageCount = Math.ceil(documentSize / 3000); // Rough estimate: 3000 chars per page
  const isMultiPageDocument = pageCount > 3;
  
  const hasComplexStructure = /ARTICLE|SECTION|CLAUSE|SCHEDULE|EXHIBIT/gi.test(documentText);
  
  console.log(`📄 Document analysis: ${documentSize} chars, ~${pageCount} pages, complex structure: ${hasComplexStructure}`);
  
  return {
    shouldChunk: isLargeDocument || (isMultiPageDocument && hasComplexStructure),
    estimatedPages: pageCount,
    documentSize,
    hasComplexStructure,
    recommendedStrategy: isLargeDocument ? 'chunking' : 'single-pass'
  };
}

module.exports = {
  intelligentDocumentChunking,
  analyzeLargeDocumentWithGemini,
  shouldUseChunking
};