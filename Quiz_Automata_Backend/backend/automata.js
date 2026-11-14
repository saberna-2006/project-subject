// DFA for the assessment lifecycle:
// START -> SUBJECT_SELECTED -> QUIZ_ACTIVE -> SUBMITTED -> EVALUATED
const transitions = {
  START: { SELECT_SUBJECT: "SUBJECT_SELECTED" },
  SUBJECT_SELECTED: { LOAD_QUESTIONS: "QUIZ_ACTIVE" },
  QUIZ_ACTIVE: { SUBMIT: "SUBMITTED" },
  SUBMITTED: { GRADE: "EVALUATED" },
  EVALUATED: { RESET: "START" }
};

function runAssessmentAutomaton(events) {
  let state = "START";
  for (const event of events) {
    const next = transitions[state]?.[event];
    if (!next) return { accepted: false, state, message: `Invalid transition: ${state} + ${event}` };
    state = next;
  }
  return {
    accepted: state === "QUIZ_ACTIVE" || state === "EVALUATED",
    state,
    message: state === "EVALUATED"
      ? "Accepted sequence: START → SUBJECT_SELECTED → QUIZ_ACTIVE → SUBMITTED → EVALUATED."
      : `Assessment ended in ${state}; evaluation is incomplete.`
  };
}
module.exports = { runAssessmentAutomaton };
