// Enhanced Legal Prompt Engineering for Vertex AI Gemini Pro
// Specialized prompts for different types of legal document analysis

/**
 * Generate specialized legal analysis prompt based on document type
 */
function generateLegalAnalysisPrompt(documentText, documentType) {
  const baseContext = `You are an expert legal document analyst with extensive experience in contract law, compliance, and risk assessment. Your task is to provide comprehensive, accurate, and actionable analysis of legal documents.`;
  
  const analysisFramework = `
COMPREHENSIVE LEGAL ANALYSIS FRAMEWORK:

1. DOCUMENT CLASSIFICATION & METADATA
   - Exact document type and subtype
   - Governing law and jurisdiction
   - Execution date and term duration
   - Amendment/version status if applicable

2. PARTIES & RELATIONSHIPS ANALYSIS  
   - Complete identification of all parties
   - Legal capacity and authority assessment
   - Relationship dynamics and power balance
   - Contact information and representation

3. CRITICAL CLAUSES EXAMINATION
   - Performance obligations and deliverables
   - Payment terms and financial obligations
   - Termination and cancellation provisions
   - Dispute resolution mechanisms
   - Liability and indemnification clauses
   - Intellectual property provisions
   - Confidentiality and non-disclosure terms

4. RISK ASSESSMENT & RED FLAGS
   - High-risk provisions requiring attention
   - Unusual or concerning language
   - Missing standard protections
   - Compliance and regulatory considerations
   - Potential enforcement challenges

5. FINANCIAL & TIMELINE ANALYSIS
   - All monetary amounts and payment schedules
   - Key dates, deadlines, and milestones
   - Performance benchmarks and metrics
   - Penalty and incentive structures

6. PRACTICAL IMPLICATIONS
   - Day-to-day operational requirements
   - Administrative and compliance burdens
   - Resource allocation needs
   - Strategic considerations`;

  // Document-type specific prompts
  const typeSpecificPrompts = {
    'rental agreement': `
RENTAL AGREEMENT SPECIFIC ANALYSIS:
- Rent amount, security deposit, and payment terms
- Lease duration and renewal options
- Maintenance and repair responsibilities
- Pet policies and restrictions
- Subletting and assignment rights
- Notice requirements for termination
- Utility responsibilities and common area usage`,

    'employment contract': `
EMPLOYMENT CONTRACT SPECIFIC ANALYSIS:
- Compensation structure (salary, bonuses, benefits)
- Job responsibilities and reporting structure
- Non-compete and non-solicitation clauses
- Intellectual property assignment
- Confidentiality obligations
- Termination procedures and severance
- Work schedule and remote work policies`,

    'non-disclosure agreement': `
NDA SPECIFIC ANALYSIS:
- Scope and definition of confidential information
- Duration of confidentiality obligations
- Permitted disclosures and exceptions
- Return or destruction of information requirements
- Remedies for breach (injunctive relief, damages)
- Survival clauses and perpetual obligations`,

    'purchase agreement': `
PURCHASE AGREEMENT SPECIFIC ANALYSIS:
- Purchase price and payment terms
- Delivery and acceptance procedures
- Warranty and quality assurance provisions
- Risk of loss and title transfer
- Inspection rights and defect procedures
- Force majeure and excuse provisions`,

    'service agreement': `
SERVICE AGREEMENT SPECIFIC ANALYSIS:
- Scope of work and deliverables specification
- Performance standards and acceptance criteria
- Service level agreements (SLAs)
- Change order and scope modification procedures
- Resource allocation and staffing requirements
- Data security and privacy protections`,

    'loan agreement': `
LOAN AGREEMENT SPECIFIC ANALYSIS:
- Principal amount, interest rate, and repayment schedule
- Collateral and security provisions
- Financial covenants and reporting requirements
- Default events and acceleration clauses
- Guarantees and personal liability
- Prepayment rights and penalties`,

    'partnership agreement': `
PARTNERSHIP AGREEMENT SPECIFIC ANALYSIS:
- Capital contributions and ownership percentages
- Profit and loss distribution mechanisms
- Management structure and decision-making authority
- Transfer restrictions and buy-sell provisions
- Fiduciary duties and conflict resolution
- Dissolution and wind-up procedures`
  };

  // Get document type specific analysis
  const specificAnalysis = typeSpecificPrompts[documentType.toLowerCase()] || `
GENERAL CONTRACT SPECIFIC ANALYSIS:
- Core obligations and performance requirements
- Payment and compensation terms
- Duration and termination provisions
- Risk allocation and liability terms
- Compliance and regulatory requirements
- Dispute resolution and governing law`;

  return `${baseContext}

${analysisFramework}

${specificAnalysis}

DOCUMENT TEXT FOR ANALYSIS:
${documentText}

ANALYSIS REQUIREMENTS:
1. Provide specific, actionable insights rather than generic observations
2. Quote relevant text sections when identifying risks or key terms
3. Use clear headings and bullet points for readability
4. Highlight any urgent or critical issues requiring immediate attention
5. Include monetary amounts, dates, and specific obligations verbatim
6. Rate risk levels as LOW, MEDIUM, or HIGH with justification
7. Suggest practical next steps or recommendations where appropriate

Please analyze this document thoroughly and provide comprehensive insights that would be valuable for legal review and business decision-making.`;
}

/**
 * Generate specialized prompt for clause explanation
 */
function generateClauseExplanationPrompt(clauseText, documentType) {
  return `You are a legal expert specializing in contract interpretation. Please explain this clause in plain English.

CLAUSE TEXT:
"${clauseText}"

DOCUMENT TYPE: ${documentType}

Please provide:
1. PLAIN ENGLISH EXPLANATION: What this clause means in simple terms
2. PRACTICAL IMPACT: How this affects the parties involved
3. LEGAL SIGNIFICANCE: Why this clause is important
4. POTENTIAL RISKS: What could go wrong or areas of concern
5. COMMON VARIATIONS: How similar clauses are typically written
6. NEGOTIATION POINTS: What aspects might be negotiable

Make your explanation accessible to non-lawyers while maintaining legal accuracy.`;
}

/**
 * Generate Q&A prompt for legal document questions
 */
function generateDocumentQAPrompt(question, documentText, documentType) {
  return `You are a legal expert providing guidance on document interpretation. Answer the user's question based on the specific document provided.

DOCUMENT TYPE: ${documentType}

USER QUESTION: ${question}

RELEVANT DOCUMENT SECTIONS:
${documentText}

ANALYSIS APPROACH:
1. Review the document for information directly relevant to the question
2. Provide specific answers based on the document text
3. Quote relevant sections to support your response
4. Indicate if the document doesn't address the question
5. Suggest what additional information might be needed
6. Highlight any risks or considerations related to the question

Please provide a comprehensive answer that addresses the user's specific question while staying grounded in the actual document content.`;
}

/**
 * Generate summary prompt for large documents
 */
function generateDocumentSummaryPrompt(documentText, documentType) {
  return `Create a comprehensive executive summary of this legal document.

DOCUMENT TYPE: ${documentType}

SUMMARY REQUIREMENTS:
1. EXECUTIVE OVERVIEW (2-3 sentences)
2. KEY PARTIES AND THEIR ROLES
3. MAIN OBLIGATIONS (what each party must do)
4. FINANCIAL TERMS (amounts, payment schedules)
5. IMPORTANT DATES AND DEADLINES
6. TERMINATION CONDITIONS
7. MAJOR RISKS OR CONCERNS
8. NEXT STEPS OR ACTION ITEMS

DOCUMENT TEXT:
${documentText}

Focus on the most business-critical information that stakeholders need to understand for decision-making.`;
}

module.exports = {
  generateLegalAnalysisPrompt,
  generateClauseExplanationPrompt,
  generateDocumentQAPrompt,
  generateDocumentSummaryPrompt
};