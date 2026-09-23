const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  mobileMenu.hidden = isOpen;
});

mobileMenu?.addEventListener('click', event => {
  if (event.target.matches('a')) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
  }
});

const navDropdowns = [...document.querySelectorAll('.nav-dropdown')];
function closeNavigation() {
  navDropdowns.forEach(item => { item.open = false; });
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}
navDropdowns.forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) navDropdowns.forEach(other => { if (other !== item) other.open = false; });
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header, .mobile-menu')) closeNavigation();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openDropdown = navDropdowns.find(item => item.open);
  if (openDropdown) openDropdown.querySelector('summary').focus();
  else if (!mobileMenu.hidden) menuButton.focus();
  closeNavigation();
});
window.matchMedia('(min-width: 1400px)').addEventListener('change', closeNavigation);

const faqItems = [...document.querySelectorAll('.accordion details')];
const faqAnimations = new WeakMap();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setFaqOpen(item, shouldOpen, animate = true) {
  const answer = item.querySelector('p');
  faqAnimations.get(item)?.cancel();

  if (!animate || reduceMotion.matches) {
    item.open = shouldOpen;
    return;
  }

  if (shouldOpen) item.open = true;
  const answerHeight = answer.scrollHeight;
  const frames = shouldOpen
    ? [
        { height: '0px', marginBottom: '0px', opacity: 0 },
        { height: `${answerHeight}px`, marginBottom: '26px', opacity: 1 }
      ]
    : [
        { height: `${answerHeight}px`, marginBottom: '26px', opacity: 1 },
        { height: '0px', marginBottom: '0px', opacity: 0 }
      ];
  const animation = answer.animate(frames, {
    duration: 280,
    easing: 'cubic-bezier(.4, 0, .2, 1)'
  });
  faqAnimations.set(item, animation);
  animation.onfinish = () => {
    if (!shouldOpen) item.open = false;
    faqAnimations.delete(item);
  };
}

faqItems.forEach(item => {
  item.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const shouldOpen = !item.open;
    if (shouldOpen) {
      faqItems.forEach(other => {
        if (other !== item && other.open) setFaqOpen(other, false);
      });
    }
    setFaqOpen(item, shouldOpen);
  });
});

const applicationForm = document.querySelector('#application-form');
const formStatus = document.querySelector('#form-status');

applicationForm?.addEventListener('submit', event => {
  event.preventDefault();
  const hasFosterType = applicationForm.querySelector('input[name="foster-type"]:checked');
  if (!hasFosterType) {
    formStatus.textContent = 'Please select at least one foster type.';
    applicationForm.querySelector('input[name="foster-type"]').focus();
    return;
  }
  if (!applicationForm.reportValidity()) return;
  formStatus.textContent = 'Thank you — your application is ready to be sent.';
});

const quizPage = document.querySelector('#quiz-page');
const quizContent = document.querySelector('#quiz-content');
const quizResult = document.querySelector('#quiz-result');
const questionCount = document.querySelector('#question-count');
const questionText = document.querySelector('#question-text');
const questionHelp = document.querySelector('#question-help');
const progress = document.querySelector('#quiz-progress');
const quizBack = document.querySelector('#quiz-back');

/* ---------- Quiz → application handoff (shared by all alternatives) ---------- */
const questions = [
  {
    text: 'Do other animals currently live in your household?',
    help: 'Other animals are allowed for bottle-fed and motherless kittens if vaccinated and non-aggressive towards other animals. Cats with kittens require a home without other animals.',
    qualifyingAnswer: null,
    reason: '',
    label: 'Other animals at home',
    group: 'home',
    yes: 'I have other animals in my home.',
    no: 'There are no other animals in my home.'
  },
  {
    text: 'Are there young children living in your household?',
    help: 'Becoming familiar with children is part of socialisation for motherless kittens.',
    qualifyingAnswer: null,
    reason: '',
    label: 'Young children at home',
    group: 'home',
    yes: 'There are young children in my household.',
    no: 'There are no young children in my household.'
  },
  {
    text: 'Can you make time to provide care and attention for foster kittens?',
    help: 'Employment status is not an exclusion. The time needed depends on the foster type.',
    qualifyingAnswer: 'yes',
    reason: 'Fostering requires time for care and attention. Discuss the needs of each foster type with the cat team.',
    label: 'Time for care',
    group: 'care',
    yes: 'I can make time to care for foster kittens.',
    no: 'I’m not sure I can make enough time for daily care yet.'
  },
  {
    text: 'Do you have your own car for veterinary trips?',
    qualifyingAnswer: 'yes',
    reason: 'The shelter asks foster families to have their own car for veterinary trips.',
    label: 'Own car',
    group: 'transport',
    yes: 'I have my own car for vet trips.',
    no: 'I don’t have my own car at the moment.'
  },
  {
    text: 'Do you live approximately 30 minutes’ drive from the shelter?',
    help: 'Living nearby helps you reach the veterinary clinic quickly if the kittens suddenly become ill. If you are unsure whether you live close enough, discuss your location with the cat team.',
    qualifyingAnswer: 'yes',
    reason: 'The shelter asks for a reasonable distance, around 30 minutes by car. Please discuss your location with the team.',
    label: '≈30 min from the shelter',
    group: 'transport',
    yes: 'I live about 30 minutes’ drive from the shelter.',
    no: 'I live more than 30 minutes’ drive from the shelter.'
  },
  {
    text: 'Can you transport the kittens for revaccination or sudden illness?',
    qualifyingAnswer: 'yes',
    reason: 'Foster families need to provide transport for revaccination or sudden illness.',
    label: 'Can drive to the vet',
    group: 'transport',
    yes: 'I can bring the kittens to the vet for revaccination or sudden illness.',
    no: 'I’d need help with transport for vet visits.'
  },
  {
    text: 'Can you provide a separate, quiet room for a mother cat and her kittens?',
    help: 'A separate room is required for a mother cat with kittens.',
    qualifyingAnswer: null,
    reason: '',
    label: 'Separate quiet room',
    group: 'home',
    yes: 'I can offer a separate, quiet room for a mother cat and her kittens.',
    no: 'I can’t offer a separate room for a mother cat.'
  },
  {
    text: 'Could you bottle-feed kittens every three hours, around the clock, for the first three to four weeks?',
    help: 'This care schedule applies to bottle-fed kittens only. The full foster period is typically nine to twelve weeks.',
    qualifyingAnswer: null,
    reason: '',
    label: 'Round-the-clock bottle-feeding',
    group: 'care',
    yes: 'I could bottle-feed every three hours, around the clock.',
    no: 'Round-the-clock bottle-feeding isn’t possible for me.'
  },
  {
    text: 'Are you comfortable providing frequent, hands-on care for newborn kittens?',
    qualifyingAnswer: null,
    reason: '',
    label: 'Hands-on newborn care',
    group: 'care',
    yes: 'I’m comfortable with frequent, hands-on care for newborn kittens.',
    no: 'I’d rather not care for newborn kittens.'
  },
  {
    text: 'Are you willing to commit to fostering as a volunteer?',
    qualifyingAnswer: 'yes',
    reason: 'The foster programme is volunteer-based and requires a reliable commitment.',
    label: 'Volunteer commitment',
    group: 'commitment',
    yes: 'I’m ready to commit to fostering as a volunteer.',
    no: 'I’m not yet sure I can commit as a volunteer.'
  }
];

const FOSTER_TYPES = [
  {
    value: 'Bottle-fed kittens',
    phrase: 'bottle-fed kittens',
    short: 'Newborns fed every 3 hours, 9–12 weeks.',
    // Needs round-the-clock feeding and newborn care.
    check: a => {
      const missing = [];
      if (a[7] !== 'yes') missing.push('feeding every 3 hours, day and night');
      if (a[8] !== 'yes') missing.push('hands-on newborn care');
      return missing;
    }
  },
  {
    value: 'Motherless kittens',
    phrase: 'motherless kittens',
    short: '4–12 weeks old, socialising and care.',
    check: a => (a[2] !== 'yes' ? ['daily time for socialising'] : [])
  },
  {
    value: 'Cat with kittens',
    phrase: 'a mother cat with her kittens',
    short: 'A mother and her litter. No other pets, own room.',
    check: a => {
      const missing = [];
      if (a[0] === 'yes') missing.push('a home without other animals');
      if (a[6] !== 'yes') missing.push('a separate, quiet room');
      return missing;
    }
  }
];

let rawAnswers = [];
let pendingHandoff = null;

function buildProfile() {
  const facts = questions.map((question, index) => ({
    index,
    label: question.label,
    group: question.group,
    answer: rawAnswers[index],
    sentence: rawAnswers[index] === 'yes' ? question.yes : question.no,
    flagged: answers[index] === false,
    reason: question.reason
  }));
  const types = FOSTER_TYPES.map(type => {
    const missing = type.check(rawAnswers);
    return { ...type, fits: missing.length === 0, missing };
  });
  return {
    isMatch: answers.every(Boolean),
    facts,
    flagged: facts.filter(fact => fact.flagged),
    types,
    suggestedTypes: types.filter(type => type.fits).map(type => type.value)
  };
}

/* Leaves the survey route and lands on the application form. updatePage()
   picks up pendingHandoff once the landing page is visible again. */
function goToApplication(handoff) {
  pendingHandoff = handoff;
  window.location.hash = 'application';
}

function runPendingHandoff() {
  if (!pendingHandoff) return;
  const handoff = pendingHandoff;
  pendingHandoff = null;
  handoff();
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function flash(elements) {
  if (reduceMotion.matches) return;
  elements.forEach(element => {
    element.classList.remove('just-filled');
    void element.offsetWidth;
    element.classList.add('just-filled');
  });
}

function landOnApplication(focusTarget) {
  const section = document.querySelector('#application');
  section.scrollIntoView({ behavior: 'instant', block: 'start' });
  focusTarget?.focus({ preventScroll: true });
}

function setFosterTypes(values) {
  applicationForm.querySelectorAll('input[name="foster-type"]').forEach(input => {
    input.checked = values.includes(input.value);
  });
}

/* Never throw away something the visitor typed themselves. */
let lastPrefill = '';
function fillSetup(text) {
  const textarea = applicationForm.elements.setup;
  const value = textarea.value;
  const previous = lastPrefill.trimEnd();
  if (!value.trim()) textarea.value = text;
  else if (previous && value.startsWith(previous)) textarea.value = text + value.slice(previous.length).trim();
  else textarea.value = text + value.trim();
  lastPrefill = text;
  autoGrow(textarea);
  return textarea;
}

const reasonIcon = '<svg class="reason-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/></svg>';
const checkIcon = '<svg class="fact-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const otherWaysToHelp = `
  <p class="result-alternatives">You can still help animals in other ways:</p>
  <div class="result-links">
    <a href="https://www.dyrenesbeskyttelse.dk/stoet-dyrene">Donate</a>
    <a href="https://www.dyrenesbeskyttelse.dk/bliv-frivillig">Become a volunteer</a>
    <a href="https://www.dyrenesbeskyttelse.dk/adopter-et-dyr">Adopt an animal</a>
  </div>`;

function finishResult() {
  quizResult.querySelector('[data-result-back]').addEventListener('click', () => {
    currentQuestion = questions.length - 1;
    renderQuestion();
    questionText.focus({ preventScroll: true });
  });
  const resultHeading = quizResult.querySelector('h2');
  resultHeading.tabIndex = -1;
  resultHeading.focus({ preventScroll: true });
}

function joinTypes(values) {
  const lower = values.map(value => FOSTER_TYPES.find(type => type.value === value)?.phrase || value.toLowerCase());
  if (lower.length <= 1) return lower[0] || '';
  return `${lower.slice(0, -1).join(', ')} and ${lower.at(-1)}`;
}

/* Keep the question card the same size for all 10 questions, so the progress
   bar, Back link and answer buttons never move. The card takes the height of
   the tallest question; if the quiz would then overflow the screen, the
   question text is scaled down step by step until everything fits. */
const questionCard = document.querySelector('.question-card');
const MIN_QUESTION_SCALE = 0.75;
let questionCardSizedFor = '';

function measureTallestQuestion() {
  const probe = questionCard.cloneNode(true);
  probe.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  probe.removeAttribute('aria-live');
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: `${questionCard.getBoundingClientRect().width}px`,
    height: 'auto',
    visibility: 'hidden',
    pointerEvents: 'none'
  });
  questionCard.after(probe);
  const count = probe.querySelector('.question-count');
  const title = probe.querySelector('h3');
  const help = probe.querySelector('h3 + p');
  let tallest = 0;
  questions.forEach((question, index) => {
    count.textContent = `${index + 1}/10`;
    title.textContent = question.text;
    help.textContent = question.help || '';
    help.hidden = !question.help;
    tallest = Math.max(tallest, probe.getBoundingClientRect().height);
  });
  probe.remove();
  return Math.ceil(tallest);
}

function sizeQuestionCard(force = false) {
  if (quizPage.hidden || quizContent.hidden) return;
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  if (!force && viewport === questionCardSizedFor) return;
  questionCardSizedFor = viewport;
  let scale = 1;
  for (;;) {
    quizPage.style.setProperty('--question-scale', scale);
    questionCard.style.height = `${measureTallestQuestion()}px`;
    const overflow = document.documentElement.scrollHeight - window.innerHeight;
    if (overflow <= 0 || scale <= MIN_QUESTION_SCALE) break;
    scale = Math.max(MIN_QUESTION_SCALE, Math.round((scale - 0.05) * 100) / 100);
  }
}

let questionResizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(questionResizeFrame);
  questionResizeFrame = requestAnimationFrame(() => sizeQuestionCard());
});
document.fonts?.ready.then(() => sizeQuestionCard(true));

let currentQuestion = 0;
let answers = [];

function renderQuestion() {
  quizResult.hidden = true;
  quizContent.hidden = false;
  questionCount.textContent = `${currentQuestion + 1}/10`;
  questionText.textContent = questions[currentQuestion].text;
  questionHelp.textContent = questions[currentQuestion].help || '';
  questionHelp.hidden = !questionHelp.textContent;
  // Hidden with visibility (not display) so the answer buttons never shift.
  quizBack.style.visibility = currentQuestion === 0 ? 'hidden' : '';
  progress.replaceChildren(...questions.map((_, index) => {
    const step = document.createElement('span');
    if (index <= currentQuestion) step.className = 'done';
    return step;
  }));
  sizeQuestionCard();
}

/* Result screen: pick the foster types to apply for, then hand off to the
   landing page application form with a pre-written message. */
function buildMessage(profile, chosenTypes) {
  const lines = ['Hi cat team,', ''];
  lines.push(chosenTypes.length
    ? `I took the foster quiz and I’m interested in fostering ${joinTypes(chosenTypes)}.`
    : 'I took the foster quiz and I’m interested in fostering.');
  if (profile.flagged.length) {
    lines.push('', 'Things I’d like to discuss:');
    profile.flagged.forEach(fact => lines.push(`• ${fact.sentence}`));
  }
  lines.push('', profile.flagged.length ? 'My other answers:' : 'About my situation:');
  profile.facts.filter(fact => !fact.flagged).forEach(fact => lines.push(`• ${fact.sentence}`));
  lines.push('', '');
  return lines.join('\n');
}

function showResult() {
  const profile = buildProfile();
  quizContent.hidden = true;
  quizResult.hidden = false;
  quizResult.classList.toggle('is-match', profile.isMatch);
  quizResult.classList.toggle('is-not-match', !profile.isMatch);

  const typeCards = profile.types.map(type => `
    <label class="match-card ${type.fits ? 'fits' : 'no-fit'}">
      <input type="checkbox" name="result-type" value="${type.value}" ${type.fits ? 'checked' : ''}>
      <span class="match-box" aria-hidden="true"></span>
      <span class="match-body">
        <strong>${type.value}</strong>
        <small>${type.short}</small>
        <span class="match-note">${type.fits
          ? `${checkIcon}<span>Matches your answers</span>`
          : `${reasonIcon}<span><span class="sr-only">To discuss: </span>Needs ${type.missing.join(' and ')}</span>`}</span>
      </span>
    </label>`).join('');

  quizResult.innerHTML = `
      <h2>${profile.isMatch ? 'Talk to the cat team' : 'Let’s discuss your setup'}</h2>
      <p>${profile.isMatch
        ? 'Your answers are a starting point, not approval for a placement. Pick the foster types you’d like to talk about.'
        : 'Your answers raise some points to discuss with the shelter. This quiz is guidance, not a final assessment.'}</p>
      <div class="result-card match-panel">
        ${profile.isMatch ? '' : `
        <h3>Points to discuss</h3>
        <ul class="failure-reasons">
          ${profile.flagged.map(fact => `<li>${reasonIcon}<span>${fact.reason}</span></li>`).join('')}
        </ul>`}
        <fieldset class="match-fieldset">
          <legend>${profile.isMatch ? 'Which foster type interests you?' : 'Which foster type would you like to ask about?'}</legend>
          <div class="match-grid">${typeCards}</div>
        </fieldset>
        <div class="handoff">
          <button class="handoff-button" type="button" data-handoff></button>
          <p>We’ll write your answers into the application message. You can change anything before you send it.</p>
        </div>
        ${profile.isMatch ? '' : otherWaysToHelp}
      </div>
      <button class="result-back" type="button" data-result-back>← Review previous answer</button>`;

  const handoffButton = quizResult.querySelector('[data-handoff]');
  const chosen = () => [...quizResult.querySelectorAll('input[name="result-type"]:checked')].map(input => input.value);
  const updateButton = () => {
    const types = chosen();
    handoffButton.textContent = types.length === 1
      ? `Apply for ${types[0].toLowerCase()} →`
      : types.length > 1 ? `Apply for ${types.length} foster types →` : (profile.isMatch ? 'Continue to application →' : 'Ask the cat team →');
  };
  quizResult.querySelectorAll('input[name="result-type"]').forEach(input => input.addEventListener('change', updateButton));
  updateButton();

  handoffButton.addEventListener('click', () => {
    const types = chosen();
    goToApplication(() => prefillApplication(profile, types));
  });
  finishResult();
}

function prefillApplication(profile, chosenTypes) {
  setFosterTypes(chosenTypes);
  const textarea = fillSetup(buildMessage(profile, chosenTypes));
  const field = textarea.closest('.field');
  let badge = field.querySelector('.prefill-badge');
  if (!badge) {
    badge = document.createElement('em');
    badge.className = 'prefill-badge';
    field.querySelector('small').after(badge);
  }
  badge.innerHTML = 'Written from your quiz answers – edit freely. <a href="#survey">Retake quiz</a>';

  const heading = document.querySelector('.application-heading h2');
  heading.tabIndex = -1;
  flash([...applicationForm.querySelectorAll('.choice-card:has(input:checked)'), textarea]);
  landOnApplication(heading);
}

function resetQuiz() {
  currentQuestion = 0;
  answers = [];
  rawAnswers = [];
  renderQuestion();
}

document.querySelectorAll('[data-open-quiz]').forEach(button => {
  button.addEventListener('click', () => {
    window.location.hash = 'survey';
  });
});

function updatePage() {
  const surveyOpen = window.location.hash === '#survey';
  document.querySelector('#main').hidden = surveyOpen;
  const headerLogo = document.querySelector('.site-header .wordmark');
  headerLogo.href = surveyOpen ? '#' : 'https://www.dyrenesbeskyttelse.dk/';
  headerLogo.setAttribute('aria-label', surveyOpen ? 'Return to landing page' : 'Dyrenes Beskyttelse home');
  document.querySelector('.site-footer').hidden = surveyOpen;
  document.querySelector('.skip-link').hidden = surveyOpen;
  closeNavigation();
  quizPage.hidden = !surveyOpen;
  if (surveyOpen) {
    resetQuiz();
    window.scrollTo({ top: 0, behavior: 'instant' });
    questionText.focus({ preventScroll: true });
  } else {
    runPendingHandoff();
  }
}
window.addEventListener('hashchange', updatePage);

document.querySelectorAll('[data-answer]').forEach(button => {
  button.addEventListener('click', () => {
    const requiredAnswer = questions[currentQuestion].qualifyingAnswer;
    answers[currentQuestion] = requiredAnswer === null || button.dataset.answer === requiredAnswer;
    rawAnswers[currentQuestion] = button.dataset.answer;
    if (currentQuestion === questions.length - 1) {
      showResult();
    } else {
      currentQuestion += 1;
      renderQuestion();
      questionText.focus({ preventScroll: true });
    }
  });
});

quizBack.addEventListener('click', () => {
  if (currentQuestion === 0) return;
  currentQuestion -= 1;
  renderQuestion();
  questionText.focus({ preventScroll: true });
});

updatePage();
