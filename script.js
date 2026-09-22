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
const progress = document.querySelector('#quiz-progress');
const quizBack = document.querySelector('#quiz-back');

const questions = [
  {
    text: 'Does a cat or dog currently live in your household?',
    qualifyingAnswer: 'no',
    reason: 'The foster kittens need a home without other cats or dogs during this programme.'
  },
  {
    text: 'Are there young children living in your household?',
    qualifyingAnswer: 'no',
    reason: 'The kittens need a calm environment without small children during their most vulnerable weeks.'
  },
  {
    text: 'Do you currently work full-time?',
    qualifyingAnswer: 'no',
    reason: 'Bottle-fed kittens need frequent care throughout the day, which is difficult alongside a full-time schedule.'
  },
  {
    text: 'Do you have your own car and a valid driver’s licence?',
    qualifyingAnswer: 'yes',
    reason: 'You need access to your own car and a valid driver’s licence for veterinary visits and emergencies.'
  },
  {
    text: 'Do you live within one hour’s drive of the shelter?',
    qualifyingAnswer: 'yes',
    reason: 'Foster families need to live within one hour of the shelter.'
  },
  {
    text: 'Could you drive the kittens to a veterinarian at any time, including at night?',
    qualifyingAnswer: 'yes',
    reason: 'You must be able to take the kittens to a veterinarian at any time in an emergency.'
  },
  {
    text: 'Could you foster a group of 3–6 kittens at the same time?',
    qualifyingAnswer: null,
    reason: ''
  },
  {
    text: 'Could you bottle-feed kittens every 2–4 hours, including overnight, for up to five weeks?',
    qualifyingAnswer: null,
    reason: ''
  },
  {
    text: 'Are you comfortable providing frequent, hands-on care for newborn kittens?',
    qualifyingAnswer: 'yes',
    reason: 'Newborn kittens require frequent, hands-on care and close monitoring.'
  },
  {
    text: 'Are you willing to commit to fostering as a volunteer?',
    qualifyingAnswer: 'yes',
    reason: 'The foster programme is volunteer-based and requires a reliable commitment.'
  }
];

let currentQuestion = 0;
let answers = [];

function renderQuestion() {
  quizResult.hidden = true;
  quizContent.hidden = false;
  questionCount.textContent = `${currentQuestion + 1}/10`;
  questionText.textContent = questions[currentQuestion].text;
  quizBack.hidden = currentQuestion === 0;
  progress.replaceChildren(...questions.map((_, index) => {
    const step = document.createElement('span');
    if (index <= currentQuestion) step.className = 'done';
    return step;
  }));
}

function showResult() {
  const isMatch = answers.every(Boolean);
  const failedReasons = questions
    .filter((_, index) => answers[index] === false)
    .map(question => question.reason);
  quizContent.hidden = true;
  quizResult.hidden = false;
  quizResult.classList.toggle('is-match', isMatch);
  quizResult.classList.toggle('is-not-match', !isMatch);

  if (isMatch) {
    quizResult.innerHTML = `
      <h2>You’re a match!</h2>
      <p>You meet the criteria to become a foster family</p>
      <div class="result-card">
        <h3>Leave your email, and our cat team will contact you about the next steps.</h3>
        <form class="result-email" id="result-email-form">
          <label class="sr-only" for="result-email">Email address</label>
          <input id="result-email" type="email" placeholder="name@example.com" required>
          <button type="submit">Send →</button>
        </form>
        <p class="privacy-note">We only use your email to contact you about fostering.</p>
        <p class="result-message" role="status"></p>
      </div>
      <button class="result-back" type="button" data-result-back>← Review previous answer</button>`;

    const resultForm = quizResult.querySelector('#result-email-form');
    resultForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!resultForm.reportValidity()) return;
      quizResult.querySelector('.result-message').textContent = 'Thank you — your email is ready to be sent.';
    });
  } else {
    quizResult.innerHTML = `
      <h2>We’re sorry</h2>
      <p>Based on your answers, some foster requirements are not currently met.</p>
      <div class="result-card">
        <h3>Why this result</h3>
        <ul class="failure-reasons">
          ${failedReasons.map(reason => `<li>${reason}</li>`).join('')}
        </ul>
        <p class="result-alternatives">You can still help animals in other ways:</p>
        <div class="result-actions">
          <a href="https://www.dyrenesbeskyttelse.dk/stoet-dyrene">Make a donation</a>
          <a href="https://www.dyrenesbeskyttelse.dk/bliv-frivillig">Become a volunteer</a>
          <a href="https://www.dyrenesbeskyttelse.dk/adopter-et-dyr">Adopt an animal</a>
        </div>
      </div>
      <button class="result-back" type="button" data-result-back>← Review previous answer</button>`;
  }

  quizResult.querySelector('[data-result-back]').addEventListener('click', () => {
    currentQuestion = questions.length - 1;
    renderQuestion();
    questionText.focus({ preventScroll: true });
  });

  const resultHeading = quizResult.querySelector('h2');
  resultHeading.tabIndex = -1;
  resultHeading.focus({ preventScroll: true });
}

function resetQuiz() {
  currentQuestion = 0;
  answers = [];
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
  }
}
window.addEventListener('hashchange', updatePage);

document.querySelectorAll('[data-answer]').forEach(button => {
  button.addEventListener('click', () => {
    const requiredAnswer = questions[currentQuestion].qualifyingAnswer;
    answers[currentQuestion] = requiredAnswer === null || button.dataset.answer === requiredAnswer;
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
