function buildFrontendResponse(aiResult) {
  return {
    sessionId: aiResult.session_id,
    transcript: aiResult.transcript,
    intent: aiResult.intent,
    responseText: aiResult.response_text,
    data: aiResult.data || {},
    confidence: aiResult.confidence,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { buildFrontendResponse };
