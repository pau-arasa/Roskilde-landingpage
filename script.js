const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mobileMenu.hidden = isOpen;
});

mobileMenu?.addEventListener('click', event => {
  if (event.target.matches('a')) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

document.querySelectorAll('.accordion details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.accordion details').forEach(other => {
      if (other !== item) other.open = false;
    });
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

const questions = [
  'Do you have a cat or dog in your household?',
  'Are there small children in the household who might be curious about kittens?',
  'Are you balancing a full-time job at the moment?',
  'Do you have your own car and a valid driver’s license to be able to transport them safely and quickly to the veterinarian when needed?',
  'Do you live within one hour of the shelter to ensure timely pickups, checkups, and emergency support when kittens need it most?',
  'In the case of illness, are you willing to drive to the veterinarian at any time, day or night?',
  'Are you ready to open your home and foster 3–6 kittens at a time?',
  'Are you prepared to wake up every 2–4 hours (even through the night) for up to 5 weeks to bottle-feed kittens?',
  'Do you feel prepared to support newborn kittens with frequent, hands-on care?',
  'Are you comfortable committing to this life-saving work as a volunteer?'
];

let currentQuestion = 0;
let answers = [];

function renderQuestion() {
  quizResult.hidden = true;
  quizContent.hidden = false;
  questionCount.textContent = `${currentQuestion + 1}/10`;
  questionText.textContent = questions[currentQuestion];
  progress.replaceChildren(...questions.map((_, index) => {
    const step = document.createElement('span');
    if (index <= currentQuestion) step.className = 'done';
    return step;
  }));
}

function showResult() {
  const isMatch = answers.slice(3).every(answer => answer === 'yes');
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
      </div>`;

    const resultForm = quizResult.querySelector('#result-email-form');
    resultForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!resultForm.reportValidity()) return;
      quizResult.querySelector('.result-message').textContent = 'Thank you — your email is ready to be sent.';
    });
  } else {
    quizResult.innerHTML = `
      <h2>We’re sorry</h2>
      <p>You do not meet the criteria to be a foster family</p>
      <div class="result-card">
        <h3>But here are some things you can do anyway to help us and our animals ;)</h3>
        <div class="result-actions">
          <a href="https://www.dyrenesbeskyttelse.dk/stoet-dyrene">Make a donation</a>
          <a href="https://www.dyrenesbeskyttelse.dk/bliv-frivillig">Become a volunteer</a>
          <a href="https://www.dyrenesbeskyttelse.dk/adopter-et-dyr">Adopt an animal</a>
        </div>
      </div>`;
  }

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
  document.querySelector('body > .site-header').hidden = surveyOpen;
  document.querySelector('.site-footer').hidden = surveyOpen;
  document.querySelector('.skip-link').hidden = surveyOpen;
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
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
    answers[currentQuestion] = button.dataset.answer;
    if (currentQuestion === questions.length - 1) {
      showResult();
    } else {
      currentQuestion += 1;
      renderQuestion();
      questionText.focus({ preventScroll: true });
    }
  });
});

updatePage();
