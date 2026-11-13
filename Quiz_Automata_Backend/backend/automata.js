
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

    if (!next) {
      return {
        accepted: false,
        state,
        message: `Invalid transition: ${state} + ${event}`
      };
    }

    state = next;
  }

  return {
    accepted: true,
    state,
    message: `Accepted sequence ending in ${state}.`
  };
}

module.exports = { runAssessmentAutomaton };
