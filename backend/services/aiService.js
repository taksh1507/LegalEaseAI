// AI Service - Centralized AI response generation using OpenAI Router
require('dotenv').config();

class AIService {
  constructor() {
    this.openaiRouterKey = process.env.OPENAI_ROUTER_KEY;
  }

  // Check if document is actually a legal document with contractual clauses
  async checkDocumentType(documentText) {
    try {
      const checkPrompt = `Analyze this document and determine if it contains LEGAL CLAUSES and CONTRACTUAL TERMS.

Document sample:
${documentText.substring(0, 1000)}

Respond with ONLY a JSON object:
{
  "isLegal": true/false,
  "documentType": "contract/academic paper/research document/technical manual/experiment/report/other",
  "confidence": 0.0-1.0
}

A document is LEGAL if it contains:
- Contractual obligations and rights
- Terms and conditions
- Payment terms, penalties, liability clauses
- Party responsibilities and obligations
- Legal agreements between parties

A document is NOT LEGAL if it contains:
- Academic research or experiments
- Technical specifications
- Educational content
- Reports or analysis
- General information`;

      const result = await this.generateResponseWithOpenAIRouter(checkPrompt);
      
      if (result && result.success) {
        try {
          const analysis = JSON.parse(result.content);
          return {
            isLegal: analysis.isLegal || false,
            documentType: analysis.documentType || 'unknown document',
            confidence: analysis.confidence || 0.5
          };
        } catch (e) {
          // Fallback: check for common legal keywords
          const legalKeywords = ['agreement', 'contract', 'terms', 'conditions', 'party', 'obligation', 'liability', 'payment', 'breach', 'termination'];
          const nonLegalKeywords = ['experiment', 'research', 'study', 'analysis', 'objective', 'methodology', 'results', 'conclusion'];
          
          const legalCount = legalKeywords.filter(keyword => documentText.toLowerCase().includes(keyword)).length;
          const nonLegalCount = nonLegalKeywords.filter(keyword => documentText.toLowerCase().includes(keyword)).length;
          
          return {
            isLegal: legalCount > nonLegalCount,
            documentType: nonLegalCount > legalCount ? 'academic/research document' : 'unknown document',
            confidence: 0.6
          };
        }
      }
      
      // Default fallback
      return { isLegal: true, documentType: 'unknown document', confidence: 0.5 };
    } catch (error) {
      console.log('Document type check failed, proceeding with legal analysis:', error.message);
      return { isLegal: true, documentType: 'unknown document', confidence: 0.5 };
    }
  }

  // Primary and only AI provider: OpenAI Router
  async generateResponseWithOpenAIRouter(prompt) {
    try {
      console.log('🚀 Trying OpenAI Router for chat response...');
      console.log('🔑 API Key present:', !!this.openaiRouterKey);
      
      if (!this.openaiRouterKey) {
        throw new Error('OpenAI Router API key not configured');
      }
      
      const requestBody = {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are LegalEaseAI, a helpful legal assistant. Provide clear, informative responses about legal matters. Keep responses conversational and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10000,
        temperature: 0.3
      };
      
      console.log('📤 Sending request to OpenRouter...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost:3001',
          'X-Title': 'LegalEaseAI'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`OpenAI Router API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Received response from OpenRouter');
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          success: true,
          content: data.choices[0].message.content.trim(),
          provider: 'LegalEaseAI'
        };
      }
      
      console.log('❌ Invalid response format:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format from OpenAI Router');
    } catch (error) {
      console.log('❌ OpenAI Router failed:', error.message);
      console.log('🔍 Full error:', error);
      return null;
    }
  }

  // Analyze legal document using AI
  async analyzeDocument(documentText) {
    // First, do a quick document type check
    const documentTypeCheck = await this.checkDocumentType(documentText);
    
    if (!documentTypeCheck.isLegal) {
      return {
        success: true,
        summary: `This appears to be ${documentTypeCheck.documentType} rather than a legal document with contractual clauses.`,
        clauses: [],
        redFlags: [
          {
            issue: "Document Type Mismatch",
            severity: "notice",
            explanation: `This document appears to be ${documentTypeCheck.documentType}, not a legal contract or agreement requiring legal analysis.`,
            potentialConsequences: "No legal analysis needed as this document does not contain contractual terms or legal obligations.",
            recommendations: "Upload a legal document such as a contract, lease agreement, terms of service, or other legal agreement for proper legal analysis.",
            legalCitations: "Legal analysis tools are designed specifically for contractual and legal documents"
          }
        ],
        keyDates: [],
        overallRiskLevel: "low",
        recommendations: ["Upload a legal contract, agreement, or terms of service document for legal analysis"],
        missingClauses: [],
        favorability: {
          forParty1: "not-applicable",
          forParty2: "not-applicable", 
          explanation: "Document type does not require legal favorability analysis as it contains no contractual terms"
        }
      };
    }

    const prompt = `As LegalEaseAI, a specialized legal document analysis assistant, analyze this LEGAL DOCUMENT with contractual clauses and terms. This document has been confirmed to contain legal clauses requiring analysis.

Document text:
${documentText.substring(0, 4000)}...

IMPORTANT: Analyze ALL legal clauses in this contract/agreement, including:
- HIGH/CRITICAL risk clauses: Serious legal issues needing immediate attention
- MEDIUM risk clauses: Areas needing legal review or clarification  
- LOW risk clauses: Well-written, favorable, or standard contractual terms

Provide comprehensive legal analysis with this structure:

{
  "summary": "Comprehensive 3-4 sentence summary of the document type, purpose, and overall assessment",
  "clauses": [
    {
      "title": "Specific clause name (e.g., 'Monthly Rent Payment', 'Termination Clause', 'Standard Notice Provision')",
      "originalText": "The exact text from the document",
      "explanation": "Detailed plain-language explanation of what this clause means",
      "riskLevel": "low/medium/high",
      "riskAssessment": "Detailed explanation of risks and potential issues (even if low risk, explain why it's standard/favorable)",
      "legalImplications": "What legal consequences or rights this creates",
      "negotiationPoints": "Suggestions for how this clause could be negotiated or improved (even for low-risk clauses)",
      "industryStandard": "Whether this is typical/unusual for this type of agreement",
      "keyTerms": ["term1", "term2", "term3"],
      "importance": "high/medium/low"
    }
  ],
  "redFlags": [
    {
      "issue": "Specific problematic clause or term (for medium/high risk) OR positive/favorable clause (for low risk)",
      "severity": "critical/high/medium/low",
      "explanation": "Detailed explanation of why this is concerning (for risks) OR why this is favorable/well-written (for low risk items)",
      "potentialConsequences": "What could happen if this clause is problematic OR what benefits this provides (for low risk)",
      "recommendations": "Specific actions to address this issue OR how to maintain/leverage this favorable term",
      "legalCitations": "Relevant legal principles or standards if applicable"
    }
  ],
  "keyDates": [
    {
      "date": "Specific date if found",
      "description": "What happens on this date",
      "importance": "critical/high/medium/low",
      "actionRequired": "What the parties need to do"
    }
  ],
  "overallRiskLevel": "low/medium/high",
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "missingClauses": [
    "Important clauses that should be present but are missing"
  ],
  "favorability": {
    "forParty1": "high/medium/low",
    "forParty2": "high/medium/low",
    "explanation": "Which party this agreement favors and why"
  }
}

Ensure your analysis is:
- Thorough and covers all significant clauses (including routine/standard ones)
- Uses plain language explanations for all risk levels
- For LOW RISK clauses: explain why they are favorable, standard, or well-written
- For MEDIUM RISK clauses: identify potential concerns and monitoring points  
- For HIGH RISK clauses: highlight serious issues requiring immediate attention
- Identifies potential risks and their implications
- Provides actionable recommendations for all clauses
- Considers industry standards and best practices
- Highlights both positive and negative aspects
- Suggests specific negotiation points where applicable
- Shows the complete picture of the document, not just problems`;

    // Try OpenAI Router
    let result;
    try {
      result = await this.generateResponseWithOpenAIRouter(prompt);
    } catch (error) {
      console.error('❌ OpenAI Router failed:', error.message);
      // Return a fallback response
      return this.getFallbackAnalysis(documentText);
    }
    
    if (result && result.success) {
      try {
        // Try to parse as JSON
        const analysis = JSON.parse(result.content);
        return {
          success: true,
          summary: analysis.summary || "Document analysis completed",
          clauses: analysis.clauses || [],
          redFlags: analysis.redFlags || [],
          keyDates: analysis.keyDates || [],
          overallRiskLevel: analysis.overallRiskLevel || "medium",
          recommendations: analysis.recommendations || [],
          missingClauses: analysis.missingClauses || [],
          favorability: analysis.favorability || { forParty1: "medium", forParty2: "medium", explanation: "Analysis not available" }
        };
      } catch (e) {
        console.log('JSON parsing failed, returning structured fallback:', e.message);
        // If not valid JSON, return structured fallback
        return {
          success: true,
          summary: result.content.substring(0, 300) + "...",
          clauses: [
            {
              title: "AI Analysis",
              originalText: "Full document content",
              explanation: result.content,
              riskLevel: "medium",
              riskAssessment: "Automated analysis provided. Manual review recommended.",
              legalImplications: "Various legal implications present in document.",
              negotiationPoints: "Review with legal counsel for negotiation strategies.",
              industryStandard: "Standards vary by jurisdiction and industry.",
              keyTerms: ["legal", "document", "analysis"],
              importance: "medium"
            }
          ],
          redFlags: [],
          keyDates: [],
          overallRiskLevel: "medium",
          recommendations: ["Review with qualified legal counsel"],
          missingClauses: [],
          favorability: { forParty1: "medium", forParty2: "medium", explanation: "Detailed analysis not available" }
        };
      }
    }

    // Fallback analysis if AI fails
    return {
      success: true,
      summary: "This appears to be a legal document that requires careful review. Key terms and conditions should be examined by a legal professional for comprehensive analysis.",
      clauses: [
        {
          title: "Document Review Required",
          originalText: "Full document content requires review",
          explanation: "This document contains legal terms that should be reviewed carefully. Consider consulting with a legal professional for detailed analysis.",
          riskLevel: "medium",
          riskAssessment: "Unable to assess risk automatically. Manual review required.",
          legalImplications: "Various legal rights and obligations may be present.",
          negotiationPoints: "Consult with legal counsel for negotiation strategies.",
          industryStandard: "Standards vary by jurisdiction and document type.",
          keyTerms: ["legal", "review", "professional"],
          importance: "high"
        }
      ],
      redFlags: [
        {
          issue: "AI Analysis Unavailable",
          severity: "medium",
          explanation: "Automated analysis is temporarily unavailable. Manual review strongly recommended.",
          potentialConsequences: "Important risks or unfavorable terms may go unnoticed without proper analysis.",
          recommendations: "Have document reviewed by qualified legal counsel before signing.",
          legalCitations: "General legal principle: All contracts should be reviewed before execution."
        }
      ],
      keyDates: [],
      overallRiskLevel: "medium",
      recommendations: [
        "Have document reviewed by qualified legal counsel",
        "Do not sign without understanding all terms and implications",
        "Consider negotiating unfavorable terms before agreement"
      ],
      missingClauses: ["Cannot determine without AI analysis"],
      favorability: { 
        forParty1: "unknown", 
        forParty2: "unknown", 
        explanation: "Document favorability cannot be determined without detailed analysis" 
      }
    };
  }

  // Generate AI response using OpenAI Router only
  async generateChatResponse(userMessage, context = '') {
    const prompt = `A user has asked: "${userMessage}"

${context ? `Context: ${context}` : ''}

Please provide a helpful, accurate response about legal matters. Keep your response conversational and informative. If the question is about specific legal advice, remind the user to consult with a qualified attorney.`;

    // Try OpenAI Router
    let result = await this.generateResponseWithOpenAIRouter(prompt);
    if (result) return result.content;

    // Fallback responses if OpenAI Router fails
    const fallbackResponses = [
      "Thank you for your question. For specific legal advice, I recommend consulting with a qualified attorney who can review your particular situation.",
      "That's an important legal consideration. Legal documents can be complex, and the specifics of your situation matter greatly.",
      "I understand your concern. Legal matters often require careful review of all relevant terms and conditions.",
      "This is a common question in legal document review. The answer often depends on the specific language used in your agreement.",
      "Legal documents can contain important nuances. I'd recommend having a legal professional review the specific terms that concern you."
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  // Fallback analysis when AI service fails
  getFallbackAnalysis(documentText) {
    const wordCount = documentText.split(' ').length;
    const hasPaymentTerms = /payment|fee|cost|price|amount/i.test(documentText);
    const hasTermination = /terminate|end|cancel|expire/i.test(documentText);
    const hasLiability = /liable|liability|responsible|damages/i.test(documentText);
    
    return {
      success: true,
      summary: `Document analysis completed. This ${wordCount}-word document contains various legal provisions that require review.`,
      clauses: [
        {
          clause: "General Terms and Conditions",
          riskLevel: "medium",
          explanation: "Standard contractual terms detected. Manual review recommended for specific provisions.",
          recommendation: "Have a legal professional review the complete document for specific terms and conditions."
        }
      ],
      redFlags: hasLiability ? [
        {
          issue: "Liability Provisions Detected",
          severity: "medium",
          explanation: "The document contains liability-related language that should be carefully reviewed.",
          potentialConsequences: "Liability terms can affect financial responsibility in case of disputes.",
          recommendations: "Review liability clauses with legal counsel to understand risk allocation.",
          legalCitations: "Standard contract law principles apply to liability provisions"
        }
      ] : [],
      keyDates: [],
      overallRiskLevel: "medium",
      recommendations: [
        "Have the document reviewed by a qualified legal professional",
        "Ensure all parties understand their obligations and rights",
        hasPaymentTerms ? "Pay special attention to payment terms and conditions" : "Review all financial obligations carefully",
        hasTermination ? "Understand termination procedures and notice requirements" : "Clarify contract duration and renewal terms"
      ],
      missingClauses: [
        "Dispute resolution mechanism",
        "Governing law clause",
        "Force majeure provisions"
      ],
      favorability: {
        forParty1: "medium",
        forParty2: "medium",
        explanation: "Document appears to have balanced terms, but detailed review needed to assess true favorability"
      },
      note: "This is a basic analysis. For comprehensive legal review, please consult with a qualified attorney."
    };
  }
}

const aiService = new AIService();

module.exports = {
  analyzeDocument: aiService.analyzeDocument.bind(aiService),
  generateChatResponse: aiService.generateChatResponse.bind(aiService)
};