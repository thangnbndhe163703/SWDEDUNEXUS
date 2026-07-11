const { AssignmentSubmission, Assignment } = require('../models');

async function gradeSubmission(submissionId) {
  const submission = await AssignmentSubmission.findByPk(submissionId, { include: [{ model: Assignment, as: 'assignment' }] });
  if (!submission) return;
  try {
    await submission.update({ status: 'processing', aiError: null });
    const assignment = submission.assignment;
    const prompt = `Bạn là giám khảo đại học. Chấm bài nộp theo đúng rubric. Không cho điểm vượt quá points của từng tiêu chí.\nĐỀ BÀI:\n${assignment.instructions}\nRUBRIC:\n${JSON.stringify(assignment.rubric)}\nBÀI NỘP:\n${submission.content}\nTrả JSON tiếng Việt.`;
    const schema = { type: 'OBJECT', required: ['score', 'feedback', 'rubricResult'], properties: {
      score: { type: 'NUMBER' }, feedback: { type: 'STRING' },
      rubricResult: { type: 'ARRAY', items: { type: 'OBJECT', required: ['criterion', 'score', 'maxScore', 'feedback'], properties: { criterion: { type: 'STRING' }, score: { type: 'NUMBER' }, maxScore: { type: 'NUMBER' }, feedback: { type: 'STRING' } } } },
    } };
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini grading failed');
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
    const result = JSON.parse(text);
    const score = Math.max(0, Math.min(Number(assignment.maxScore), Number(result.score) || 0));
    await submission.update({ status: 'completed', score, feedback: result.feedback, rubricResult: result.rubricResult, gradedAt: new Date(), aiError: null });
  } catch (error) {
    await submission.update({ status: 'failed', aiError: error.message });
  }
}

module.exports = { gradeSubmission };
