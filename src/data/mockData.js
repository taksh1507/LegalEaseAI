// Mock data for LegalEaseAI application

// Document Summary Mock Data
export const mockSummary = {
  title: "Residential Rental Agreement Analysis",
  description: "This document establishes the terms for renting a residential property between landlord and tenant, including payment obligations, property use restrictions, and termination conditions.",
  keyPoints: [
    "Monthly rent of $2,400 due on the 1st of each month with $75 late fee after 5 days",
    "12-month lease term with automatic renewal unless 30-day notice is given",
    "Security deposit of $2,400 required, refundable subject to property condition",
    "Tenant responsible for utilities except water and trash collection",
    "No pets allowed without written permission and additional $500 deposit",
    "Landlord must provide 24-hour notice before property entry except emergencies",
    "Early termination requires 60-day notice and 2 months rent penalty"
  ],
  stats: {
    totalClauses: 23,
    riskyClauses: 4,
    readingTime: "12 min"
  }
};

// Clauses Mock Data
export const mockClauses = [
  {
    id: 1,
    title: "Monthly Rent Payment",
    originalText: "Tenant agrees to pay Landlord the sum of $2,400.00 per month, due and payable in advance on the first day of each calendar month. If rent is not received within five (5) days after the due date, Tenant shall pay a late fee of $75.00 in addition to the monthly rent. Continued late payment may result in termination of this lease.",
    explanation: "You need to pay $2,400 every month by the 1st. If you're late by more than 5 days, you'll be charged an extra $75. If you're consistently late with payments, the landlord can end your lease early.",
    riskLevel: "low",
    riskAssessment: "Standard rent payment terms. The late fee is reasonable and the grace period is fair.",
    keyTerms: ["Monthly rent", "Late fee", "Due date"],
    recommendations: [
      "Set up automatic payments to avoid late fees",
      "Keep records of all rent payments"
    ]
  },
  {
    id: 2,
    title: "Automatic Lease Renewal",
    originalText: "This lease shall automatically renew for successive periods of twelve (12) months unless either party gives written notice of termination at least thirty (30) days prior to the expiration date. Upon automatic renewal, rent may be increased by up to 10% at Landlord's discretion.",
    explanation: "Your lease will automatically continue for another year unless either you or the landlord gives 30 days written notice before it expires. When it renews, your rent could go up by as much as 10%.",
    riskLevel: "high",
    riskAssessment: "Automatic renewal with potential 10% rent increase could be costly. Easy to forget the 30-day notice requirement.",
    keyTerms: ["Automatic renewal", "30-day notice", "Rent increase"],
    recommendations: [
      "Set calendar reminders 60 days before lease expiration",
      "Negotiate a cap on rent increases",
      "Consider requesting mutual consent for renewal instead of automatic"
    ]
  },
  {
    id: 3,
    title: "Security Deposit",
    originalText: "Tenant shall deposit with Landlord the sum of $2,400.00 as security for the faithful performance of the terms of this lease. Said deposit may be used by Landlord to remedy any default in the payment of rent or to repair damages to the premises caused by Tenant, normal wear and tear excepted.",
    explanation: "You must pay a $2,400 security deposit upfront. The landlord can use this money if you don't pay rent or if you damage the property beyond normal wear and tear.",
    riskLevel: "low",
    riskAssessment: "Standard security deposit equal to one month's rent. Clear terms for when it can be used.",
    keyTerms: ["Security deposit", "Normal wear and tear", "Property damage"],
    recommendations: [
      "Document property condition with photos at move-in",
      "Understand what constitutes 'normal wear and tear'",
      "Request written list of any existing damages"
    ]
  },
  {
    id: 4,
    title: "Property Entry Rights",
    originalText: "Landlord shall have the right to enter the premises at any reasonable time upon twenty-four (24) hours written notice to Tenant for the purpose of inspection, maintenance, or showing to prospective tenants or buyers. In case of emergency, Landlord may enter without notice.",
    explanation: "Your landlord can enter your rental unit with 24 hours written notice for inspections, repairs, or to show it to others. In emergencies, they can enter immediately without notice.",
    riskLevel: "low",
    riskAssessment: "Standard entry terms that balance landlord's property rights with tenant's privacy. 24-hour notice is reasonable.",
    keyTerms: ["Entry rights", "24-hour notice", "Emergency access"],
    recommendations: [
      "Request advance notice whenever possible",
      "Be present during non-emergency entries when feasible",
      "Know your state's specific laws about landlord entry"
    ]
  },
  {
    id: 5,
    title: "Early Termination Penalty",
    originalText: "If Tenant terminates this lease prior to the expiration date without Landlord's written consent, Tenant shall pay Landlord a penalty equal to two (2) months' rent plus forfeit the entire security deposit, regardless of the condition of the premises.",
    explanation: "If you need to move out before your lease ends and the landlord doesn't agree to let you out early, you'll have to pay 2 months rent ($4,800) as a penalty AND lose your entire $2,400 security deposit.",
    riskLevel: "high",
    riskAssessment: "Very expensive early termination penalty totaling $7,200. This is higher than typical market standards and provides no flexibility for legitimate reasons to break lease.",
    keyTerms: ["Early termination", "Penalty fee", "Security deposit forfeiture"],
    recommendations: [
      "Negotiate a lower penalty or graduated penalty structure",
      "Request exceptions for job relocation, military deployment, or domestic violence",
      "Consider shorter lease terms if future plans are uncertain",
      "Explore subletting options as alternative"
    ]
  },
  {
    id: 6,
    title: "Pet Policy",
    originalText: "No pets are allowed on the premises without prior written consent of Landlord. If Landlord consents to pets, Tenant must pay an additional deposit of $500.00 per pet and additional monthly rent of $50.00 per pet. Tenant is liable for all pet-related damages.",
    explanation: "Pets aren't allowed unless the landlord gives written permission. If they say yes, you'll pay an extra $500 deposit and $50 per month for each pet, plus you're responsible for any damage your pet causes.",
    riskLevel: "medium",
    riskAssessment: "Pet restrictions are common, but fees are on the higher side. Unlimited liability for pet damages could be expensive.",
    keyTerms: ["Pet deposit", "Monthly pet fee", "Pet liability"],
    recommendations: [
      "Get pet approval in writing before moving in",
      "Consider pet insurance to cover potential damages",
      "Document pet's training and vaccination records"
    ]
  }
];

// Red Flags Mock Data
export const mockRedFlags = [
  {
    id: 1,
    clauseNumber: 2,
    severity: "critical",
    title: "Automatic Renewal with Rent Increase",
    description: "The lease automatically renews with potential 10% rent increase unless you remember to give 30-day notice. This could result in unexpectedly high rent or difficulty moving out.",
    recommendation: "Set multiple calendar reminders and negotiate a lower maximum rent increase percentage."
  },
  {
    id: 2,
    clauseNumber: 5,
    severity: "critical", 
    title: "Excessive Early Termination Penalty",
    description: "Breaking the lease early costs $7,200 total (2 months rent + lost security deposit), which is unusually high and provides no flexibility for legitimate circumstances.",
    recommendation: "Negotiate a lower penalty structure and request exceptions for job relocation or other qualifying circumstances."
  },
  {
    id: 3,
    clauseNumber: 6,
    severity: "warning",
    title: "High Pet Fees",
    description: "Pet deposit ($500) and monthly fee ($50) are above market average, plus unlimited liability for pet damages.",
    recommendation: "Negotiate lower pet fees and consider requesting a cap on pet damage liability."
  },
  {
    id: 4,
    clauseNumber: 12,
    severity: "notice",
    title: "Landlord Maintenance Responsibility",
    description: "Document is unclear about which maintenance items are landlord vs. tenant responsibility.",
    recommendation: "Request a written list clarifying maintenance responsibilities for both parties."
  }
];

// Chat History Mock Data
export const mockChatHistory = [
  {
    id: 1,
    text: "Hi! I've analyzed your rental agreement. I'm here to answer any questions you have about the clauses, risks, or terms. What would you like to know?",
    sender: "ai",
    timestamp: "2025-09-18T10:00:00Z"
  }
];

// Additional mock responses for chat (used in App.js)
export const mockChatResponses = [
  "Based on the document analysis, I can help clarify that clause for you.",
  "That's an important question. Let me explain the legal implications of that section.",
  "From what I can see in the document, this clause typically means...",
  "Great question! This is actually a common concern in legal documents.",
  "I'd recommend paying close attention to that particular clause because it has significant implications for your rights.",
  "This clause is fairly standard, but here's what you should understand about it...",
  "Looking at the risk assessment, this particular section is flagged because...",
  "That's a high-risk clause. Here's why it could be problematic and what you can do about it."
];

const defaultExport = {
  mockSummary,
  mockClauses,
  mockRedFlags,
  mockChatHistory,
  mockChatResponses
};

export default defaultExport;