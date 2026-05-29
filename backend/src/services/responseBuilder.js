function buildFrontendResponse(aiResult) {
  return {
    sessionId: aiResult.session_id,
    transcript: aiResult.transcript,
    intent: aiResult.intent,
    responseText: aiResult.response_text,
    responseAudioBase64: aiResult.response_audio_base64,
    responseAudioMimeType: aiResult.response_audio_mime_type,
    data: aiResult.data || {},
    confidence: aiResult.confidence,
    createdAt: new Date().toISOString()
  };
}

module.exports = { buildFrontendResponse };