/* ==========================================================================
   KINGS SPORTS | TIGER BASKETBALL CLUB — script.js
   1. Weekend fixtures popup
   2. Registration form validation + Supabase submission
   3. Player profile submission + Meet the Team grid
   4. Donation form validation + Supabase submission
   ========================================================================== */

/* ------------------------------------------------------------------
   SUPABASE SETUP
   ------------------------------------------------------------------ */
var SUPABASE_URL = 'https://mpmxknkospiifcrvmagu.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_OVyAp22IaH3WbYr_6aJO8Q_xN4vnO5-';
var supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
     2. REGISTRATION FORM VALIDATION + SUPABASE SUBMISSION
     ------------------------------------------------------------------ */
  var form = document.getElementById('registerForm');

  if (form) {
    var nameInput    = document.getElementById('regName');
    var emailInput   = document.getElementById('regEmail');
    var phoneInput   = document.getElementById('regPhone');
    var genderInputs = form.querySelectorAll('input[name="gender"]');
    var successMsg   = document.getElementById('formSuccess');
    var submitBtn    = form.querySelector('.btn-submit');

    var nameError   = document.getElementById('nameError');
    var emailError  = document.getElementById('emailError');
    var phoneError  = document.getElementById('phoneError');
    var genderError = document.getElementById('genderError');

    var EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    var PHONE_RULE = /^\+?[0-9\s-]{8,15}$/;

    var setError = function (el, msg) { el.textContent = msg; };
    var clearError = function (el)    { el.textContent = ''; };

    var validateName = function () {
      var value = nameInput.value.trim();
      if (value.length === 0) { setError(nameError, 'Please enter your full name.'); return false; }
      if (value.length < 2)   { setError(nameError, 'Name must be at least 2 characters.'); return false; }
      clearError(nameError);
      return true;
    };

    var validateEmail = function () {
      var value = emailInput.value.trim();
      if (value.length === 0)       { setError(emailError, 'Please enter your email address.'); return false; }
      if (!EMAIL_RULE.test(value))  { setError(emailError, 'Enter a valid email, e.g. name@example.com.'); return false; }
      clearError(emailError);
      return true;
    };

    var validatePhone = function () {
      var value = phoneInput.value.trim();
      if (value.length === 0)       { setError(phoneError, 'Please enter your phone number.'); return false; }
      if (!PHONE_RULE.test(value))  { setError(phoneError, 'Enter a valid phone number (8–15 digits, may start with +).'); return false; }
      clearError(phoneError);
      return true;
    };

    var validateGender = function () {
      var checked = Array.prototype.some.call(genderInputs, function (input) { return input.checked; });
      if (!checked) { setError(genderError, 'Please select a gender.'); return false; }
      clearError(genderError);
      return true;
    };

    // Live validation on blur
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    phoneInput.addEventListener('blur', validatePhone);
    genderInputs.forEach(function (input) {
      input.addEventListener('change', validateGender);
    });

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var isNameValid   = validateName();
      var isEmailValid  = validateEmail();
      var isPhoneValid  = validatePhone();
      var isGenderValid = validateGender();

      if (!isNameValid || !isEmailValid || !isPhoneValid || !isGenderValid) {
        successMsg.classList.remove('visible');
        successMsg.textContent = '';
        return;
      }

      var selectedGender = Array.prototype.find.call(genderInputs, function (input) {
        return input.checked;
      }).value;

      // Disable button while submitting
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      // Send to Supabase
      supabaseClient
        .from('registrations')
        .insert([{
          full_name: nameInput.value.trim(),
          email:     emailInput.value.trim(),
          phone:     phoneInput.value.trim(),
          gender:    selectedGender
        }])
        .then(function (result) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Register';

          if (result.error) {
            // Show error to user
            successMsg.style.color = '#C23B2E';
            successMsg.textContent = 'Something went wrong: ' + result.error.message;
            successMsg.classList.add('visible');
          } else {
            // Success
            successMsg.style.color = '';
            successMsg.textContent =
              'Thanks, ' + nameInput.value.trim() + '! Your registration has been received. We\'ll be in touch soon.';
            successMsg.classList.add('visible');

            form.reset();
            [nameError, emailError, phoneError, genderError].forEach(clearError);
          }
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Register';
          successMsg.style.color = '#C23B2E';
          successMsg.textContent = 'Network error. Please check your connection and try again.';
          successMsg.classList.add('visible');
        });
    });
  }


  /* ------------------------------------------------------------------
     3. PLAYER PROFILE SUBMISSION + MEET THE TEAM GRID
     ------------------------------------------------------------------ */
  var playerForm = document.getElementById('playerForm');
  var playerFormStatus = document.getElementById('playerFormStatus');

  if (playerForm) {
    playerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      playerFormStatus.style.color = '';
      playerFormStatus.textContent = 'Submitting...';

      var fullName = document.getElementById('playerName').value.trim();
      var position = document.getElementById('playerPosition').value.trim();
      var jerseyNumberRaw = document.getElementById('playerNumber').value.trim();
      var jerseyNumber = jerseyNumberRaw === '' ? null : Number(jerseyNumberRaw);
      var bio = document.getElementById('playerBio').value.trim();
      var photoFile = document.getElementById('playerPhoto').files[0];

      var photoUrl = null;

      try {
        if (photoFile) {
          var fileExt = photoFile.name.split('.').pop();
          var fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + fileExt;

          var uploadResult = await supabaseClient
            .storage
            .from('player-photos')
            .upload(fileName, photoFile);

          if (uploadResult.error) throw uploadResult.error;

          var publicUrlData = supabaseClient
            .storage
            .from('player-photos')
            .getPublicUrl(fileName);

          photoUrl = publicUrlData.data.publicUrl;
        }

        var insertResult = await supabaseClient
          .from('players')
          .insert([{
            full_name: fullName,
            position: position,
            jersey_number: jerseyNumber,
            bio: bio,
            photo_url: photoUrl,
            approved: false
          }]);

        if (insertResult.error) throw insertResult.error;

        playerFormStatus.style.color = '';
        playerFormStatus.textContent = 'Profile submitted! It will appear once approved.';
        playerForm.reset();
      } catch (err) {
        console.error(err);
        playerFormStatus.style.color = '#C23B2E';
        playerFormStatus.textContent = 'Something went wrong: ' + (err.message || 'please try again.');
      }
    });
  }

  var playersGrid = document.getElementById('playersGrid');

  if (playersGrid) {
    loadPlayers();
  }

  async function loadPlayers() {
    var result = await supabaseClient
      .from('players')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (result.error) {
      console.error(result.error);
      return;
    }

    playersGrid.innerHTML = result.data.map(function (p) {
      var avatar = p.photo_url
        ? '<img src="' + p.photo_url + '" alt="' + p.full_name + '">'
        : '<img class="player-avatar" src="https://ui-avatars.com/api/?name=' + encodeURIComponent(p.full_name) + '&background=E8881A&color=fff" alt="' + p.full_name + '">';

      return '<div class="player-card">' +
        avatar +
        '<h3>' + p.full_name + '</h3>' +
        '<p class="player-meta">' + (p.position || '') + (p.jersey_number ? ' · #' + p.jersey_number : '') + '</p>' +
        (p.bio ? '<p class="player-bio">' + p.bio + '</p>' : '') +
        '</div>';
    }).join('');
  }


  /* ------------------------------------------------------------------
     4. DONATION FORM VALIDATION + SUPABASE SUBMISSION
     ------------------------------------------------------------------ */
  var donationForm = document.getElementById('donationForm');

  if (donationForm) {
    var donNameInput    = document.getElementById('donName');
    var donPhoneInput   = document.getElementById('donPhone');
    var donAmountInput  = document.getElementById('donAmount');
    var donMessageInput = document.getElementById('donMessage');
    var donationSuccess = document.getElementById('donationSuccess');
    var donationSubmit  = donationForm.querySelector('.btn-submit');

    var donNameError   = document.getElementById('donNameError');
    var donPhoneError  = document.getElementById('donPhoneError');
    var donAmountError = document.getElementById('donAmountError');

    var DON_PHONE_RULE = /^\+?[0-9\s-]{8,15}$/;

    var donSetError   = function (el, msg) { el.textContent = msg; };
    var donClearError = function (el)      { el.textContent = ''; };

    var validateDonName = function () {
      var value = donNameInput.value.trim();
      if (value.length === 0) { donSetError(donNameError, 'Please enter your full name.'); return false; }
      if (value.length < 2)   { donSetError(donNameError, 'Name must be at least 2 characters.'); return false; }
      donClearError(donNameError);
      return true;
    };

    var validateDonPhone = function () {
      var value = donPhoneInput.value.trim();
      if (value.length === 0)          { donSetError(donPhoneError, 'Please enter the phone number you used.'); return false; }
      if (!DON_PHONE_RULE.test(value)) { donSetError(donPhoneError, 'Enter a valid phone number (8–15 digits, may start with +).'); return false; }
      donClearError(donPhoneError);
      return true;
    };

    var validateDonAmount = function () {
      var value = donAmountInput.value.trim();
      var numValue = Number(value);
      if (value.length === 0)          { donSetError(donAmountError, 'Please enter the amount you sent.'); return false; }
      if (isNaN(numValue) || numValue <= 0) { donSetError(donAmountError, 'Enter a valid amount greater than 0.'); return false; }
      donClearError(donAmountError);
      return true;
    };

    // Live validation on blur
    donNameInput.addEventListener('blur', validateDonName);
    donPhoneInput.addEventListener('blur', validateDonPhone);
    donAmountInput.addEventListener('blur', validateDonAmount);

    // Form submit
    donationForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var isDonNameValid   = validateDonName();
      var isDonPhoneValid  = validateDonPhone();
      var isDonAmountValid = validateDonAmount();

      if (!isDonNameValid || !isDonPhoneValid || !isDonAmountValid) {
        donationSuccess.classList.remove('visible');
        donationSuccess.textContent = '';
        return;
      }

      // Disable button while submitting
      donationSubmit.disabled = true;
      donationSubmit.textContent = 'Sending…';

      // Send to Supabase
      supabaseClient
        .from('donations')
        .insert([{
          donor_name: donNameInput.value.trim(),
          phone:      donPhoneInput.value.trim(),
          amount:     Number(donAmountInput.value.trim()),
          message:    donMessageInput.value.trim() || null
        }])
        .then(function (result) {
          donationSubmit.disabled = false;
          donationSubmit.textContent = 'Confirm Donation';

          if (result.error) {
            // Show error to user
            donationSuccess.style.color = '#C23B2E';
            donationSuccess.textContent = 'Something went wrong: ' + result.error.message;
            donationSuccess.classList.add('visible');
          } else {
            // Success
            donationSuccess.style.color = '';
            donationSuccess.textContent =
              'Asante, ' + donNameInput.value.trim() + '! Thank you for supporting the Tigers 🏀';
            donationSuccess.classList.add('visible');

            donationForm.reset();
            [donNameError, donPhoneError, donAmountError].forEach(donClearError);
          }
        })
        .catch(function (err) {
          donationSubmit.disabled = false;
          donationSubmit.textContent = 'Confirm Donation';
          donationSuccess.style.color = '#C23B2E';
          donationSuccess.textContent = 'Network error. Please check your connection and try again.';
          donationSuccess.classList.add('visible');
        });
    });
  }

});
