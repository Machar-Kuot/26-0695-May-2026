/* ==========================================================================
   KINGS SPORTS | TIGER BASKETBALL CLUB — script.js
   1. Weekend fixtures popup
   2. Registration form validation (name, email, phone, gender)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------------------------------
     1. WEEKEND FIXTURES POPUP
     Shows once per page load. Closing via the × or clicking outside
     lets it reappear later (e.g. via a "Show fixtures" trigger), but
     clicking "Got it" dismisses it for the rest of this page session
     — it only comes back if the page is reloaded.
     ------------------------------------------------------------------ */
  var overlay = document.getElementById('fixturesOverlay');
  var closeBtn = document.getElementById('fixturesClose');
  var dismissBtn = document.getElementById('fixturesDismiss');
  var dismissedForSession = false;

  function openFixtures() {
    if (dismissedForSession) return;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    dismissBtn.focus();
  }

  function closeFixtures() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  if (overlay) {
    setTimeout(openFixtures, 1200);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeFixtures);

  // "Got it" closes the popup and keeps it hidden until the page reloads
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function () {
      dismissedForSession = true;
      closeFixtures();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeFixtures();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && !overlay.hidden) closeFixtures();
  });


  /* ------------------------------------------------------------------
     2. REGISTRATION FORM VALIDATION
     ------------------------------------------------------------------ */
  var form = document.getElementById('registerForm');
  if (!form) return;

  var nameInput = document.getElementById('regName');
  var emailInput = document.getElementById('regEmail');
  var phoneInput = document.getElementById('regPhone');
  var genderInputs = form.querySelectorAll('input[name="gender"]');
  var successMsg = document.getElementById('formSuccess');

  var nameError = document.getElementById('nameError');
  var emailError = document.getElementById('emailError');
  var phoneError = document.getElementById('phoneError');
  var genderError = document.getElementById('genderError');

  // Standard, practical email rule: local@domain.tld
  var EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Accepts digits, spaces, dashes, optional leading +, 8–15 digits total
  var PHONE_RULE = /^\+?[0-9\s-]{8,15}$/;

  function setError(el, msg) {
    el.textContent = msg;
  }

  function clearError(el) {
    el.textContent = '';
  }

  function validateName() {
    var value = nameInput.value.trim();
    if (value.length === 0) {
      setError(nameError, 'Please enter your full name.');
      return false;
    }
    if (value.length < 2) {
      setError(nameError, 'Name must be at least 2 characters.');
      return false;
    }
    clearError(nameError);
    return true;
  }

  function validateEmail() {
    var value = emailInput.value.trim();
    if (value.length === 0) {
      setError(emailError, 'Please enter your email address.');
      return false;
    }
    if (!EMAIL_RULE.test(value)) {
      setError(emailError, 'Enter a valid email, e.g. name@example.com.');
      return false;
    }
    clearError(emailError);
    return true;
  }

  function validatePhone() {
    var value = phoneInput.value.trim();
    if (value.length === 0) {
      setError(phoneError, 'Please enter your phone number.');
      return false;
    }
    if (!PHONE_RULE.test(value)) {
      setError(phoneError, 'Enter a valid phone number (8–15 digits, may start with +).');
      return false;
    }
    clearError(phoneError);
    return true;
  }

  function validateGender() {
    var checked = Array.prototype.some.call(genderInputs, function (input) {
      return input.checked;
    });
    if (!checked) {
      setError(genderError, 'Please select a gender.');
      return false;
    }
    clearError(genderError);
    return true;
  }

  // Live validation as the user types/selects
  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);
  phoneInput.addEventListener('blur', validatePhone);
  genderInputs.forEach(function (input) {
    input.addEventListener('change', validateGender);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var isNameValid = validateName();
    var isEmailValid = validateEmail();
    var isPhoneValid = validatePhone();
    var isGenderValid = validateGender();

    if (isNameValid && isEmailValid && isPhoneValid && isGenderValid) {
      var selectedGender = Array.prototype.find.call(genderInputs, function (input) {
        return input.checked;
      }).value;

      successMsg.textContent =
        'Thanks, ' + nameInput.value.trim() + '! Your registration has been received.';
      successMsg.classList.add('visible');

      form.reset();
      [nameError, emailError, phoneError, genderError].forEach(clearError);

      // Replace this with a real submission (fetch/AJAX) when a backend is ready.
      console.log('Registration submitted:', {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        gender: selectedGender
      });
    } else {
      successMsg.classList.remove('visible');
      successMsg.textContent = '';
    }
  });

});

