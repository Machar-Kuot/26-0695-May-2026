/* ==========================================================================
   KINGS SPORTS | TIGER BASKETBALL CLUB — script.js
   1. Weekend fixtures popup
   2. Registration form validation + Supabase submission
   3. Player auth (login/signup) + profile creation + Team Feed
   4. Meet the Team grid
   5. Donation form validation + Supabase submission
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

    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    phoneInput.addEventListener('blur', validatePhone);
    genderInputs.forEach(function (input) {
      input.addEventListener('change', validateGender);
    });

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

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

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
            successMsg.style.color = '#C23B2E';
            successMsg.textContent = 'Something went wrong: ' + result.error.message;
            successMsg.classList.add('visible');
          } else {
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
     3. PLAYER AUTH (LOGIN / SIGNUP) + PROFILE + TEAM FEED
     ------------------------------------------------------------------ */
  var playerProfileSection = document.getElementById('player-profile-form');
  var teamFeedSection = document.getElementById('team-feed');

  var authTabsWrap = document.getElementById('authTabs');
  var authTabs = document.querySelectorAll('.auth-tab');
  var loginForm = document.getElementById('loginForm');
  var signupForm = document.getElementById('signupForm');
  var loginStatus = document.getElementById('loginStatus');
  var signupStatus = document.getElementById('signupStatus');
  var loggedInBar = document.getElementById('loggedInBar');
  var loggedInEmail = document.getElementById('loggedInEmail');
  var logoutBtn = document.getElementById('logoutBtn');

  var currentUser = null;
  var currentPlayer = null;

  // Helper: upload any file to the player-photos bucket, return its public URL
  async function uploadToPlayerPhotos(file) {
    var fileExt = file.name.split('.').pop();
    var fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + fileExt;

    var uploadResult = await supabaseClient.storage.from('player-photos').upload(fileName, file);
    if (uploadResult.error) throw uploadResult.error;

    var publicUrlData = supabaseClient.storage.from('player-photos').getPublicUrl(fileName);
    return publicUrlData.data.publicUrl;
  }

  // Tab switching (Log In / Sign Up)
  if (authTabs.length) {
    authTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        authTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        if (tab.dataset.tab === 'login') {
          loginForm.hidden = false;
          signupForm.hidden = true;
        } else {
          loginForm.hidden = true;
          signupForm.hidden = false;
        }
      });
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      loginStatus.style.color = '';
      loginStatus.textContent = 'Logging in…';

      var email = document.getElementById('loginEmail').value.trim();
      var password = document.getElementById('loginPassword').value;

      var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });

      if (result.error) {
        loginStatus.style.color = '#C23B2E';
        loginStatus.textContent = result.error.message;
        return;
      }

      loginStatus.textContent = '';
      loginForm.reset();
      await handleAuthSession(result.data.session);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      signupStatus.style.color = '';
      signupStatus.textContent = 'Creating account…';

      var email = document.getElementById('signupEmail').value.trim();
      var password = document.getElementById('signupPassword').value;

      var result = await supabaseClient.auth.signUp({ email: email, password: password });

      if (result.error) {
        signupStatus.style.color = '#C23B2E';
        signupStatus.textContent = result.error.message;
        return;
      }

      signupForm.reset();

      if (result.data.session) {
        signupStatus.textContent = '';
        await handleAuthSession(result.data.session);
      } else {
        signupStatus.style.color = '';
        signupStatus.textContent = 'Account created! Check your email to confirm, then log in.';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      await supabaseClient.auth.signOut();
      currentUser = null;
      currentPlayer = null;
      updateAuthUI();
    });
  }

  async function handleAuthSession(session) {
    currentUser = session ? session.user : null;
    if (currentUser) {
      await loadCurrentPlayer();
    } else {
      currentPlayer = null;
    }
    updateAuthUI();
  }

  async function loadCurrentPlayer() {
    var result = await supabaseClient
      .from('players')
      .select('*')
      .eq('auth_id', currentUser.id)
      .maybeSingle();

    if (result.error) {
      console.error(result.error);
      return;
    }
    currentPlayer = result.data;
  }

  function updateAuthUI() {
    if (currentUser) {
      if (authTabsWrap) authTabsWrap.hidden = true;
      if (loginForm) loginForm.hidden = true;
      if (signupForm) signupForm.hidden = true;
      if (loggedInBar) {
        loggedInBar.hidden = false;
        loggedInEmail.textContent = currentUser.email;
      }

      if (currentPlayer) {
        if (playerProfileSection) playerProfileSection.hidden = true;
        if (teamFeedSection) teamFeedSection.hidden = false;
        loadFeed();
      } else {
        if (playerProfileSection) playerProfileSection.hidden = false;
        if (teamFeedSection) teamFeedSection.hidden = true;
      }
    } else {
      if (authTabsWrap) authTabsWrap.hidden = false;
      if (loginForm) loginForm.hidden = false;
      if (signupForm) signupForm.hidden = true;
      if (loggedInBar) loggedInBar.hidden = true;
      if (playerProfileSection) playerProfileSection.hidden = true;
      if (teamFeedSection) teamFeedSection.hidden = true;
    }
  }

  // Restore session on page load, and react to future auth changes
  supabaseClient.auth.getSession().then(function (result) {
    handleAuthSession(result.data.session);
  });

  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentPlayer = null;
      updateAuthUI();
    }
  });

  // Player profile creation (requires login)
  var playerForm = document.getElementById('playerForm');
  var playerFormStatus = document.getElementById('playerFormStatus');

  if (playerForm) {
    playerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!currentUser) {
        playerFormStatus.style.color = '#C23B2E';
        playerFormStatus.textContent = 'Please log in first.';
        return;
      }

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
          photoUrl = await uploadToPlayerPhotos(photoFile);
        }

        var insertResult = await supabaseClient
          .from('players')
          .insert([{
            auth_id: currentUser.id,
            full_name: fullName,
            position: position,
            jersey_number: jerseyNumber,
            bio: bio,
            photo_url: photoUrl,
            approved: false
          }])
          .select()
          .single();

        if (insertResult.error) throw insertResult.error;

        currentPlayer = insertResult.data;
        playerFormStatus.style.color = '';
        playerFormStatus.textContent = 'Profile submitted! It will appear once approved.';
        playerForm.reset();
        updateAuthUI();
      } catch (err) {
        console.error(err);
        playerFormStatus.style.color = '#C23B2E';
        playerFormStatus.textContent = 'Something went wrong: ' + (err.message || 'please try again.');
      }
    });
  }

  // Team Feed: posting a photo
  var postForm = document.getElementById('postForm');
  var postFormStatus = document.getElementById('postFormStatus');
  var feedContainer = document.getElementById('feedContainer');

  if (postForm) {
    postForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (!currentPlayer) return;

      postFormStatus.style.color = '';
      postFormStatus.textContent = 'Posting...';

      var photoFile = document.getElementById('postPhoto').files[0];
      var caption = document.getElementById('postCaption').value.trim();

      try {
        var imageUrl = await uploadToPlayerPhotos(photoFile);

        var insertResult = await supabaseClient
          .from('posts')
          .insert([{
            player_id: currentPlayer.id,
            image_url: imageUrl,
            caption: caption || null,
            approved: false
          }]);

        if (insertResult.error) throw insertResult.error;

        postFormStatus.style.color = '';
        postFormStatus.textContent = 'Posted! It will appear in the feed once approved.';
        postForm.reset();
        loadFeed();
      } catch (err) {
        console.error(err);
        postFormStatus.style.color = '#C23B2E';
        postFormStatus.textContent = 'Something went wrong: ' + (err.message || 'please try again.');
      }
    });
  }

  // Team Feed: loading + rendering posts with likes and comments
  async function loadFeed() {
    if (!feedContainer) return;

    var result = await supabaseClient
      .from('posts')
      .select('id, image_url, caption, created_at, approved, players ( id, full_name, jersey_number, photo_url ), likes ( id, player_id ), comments ( id, comment, created_at, players ( full_name ) )')
      .order('created_at', { ascending: false });

    if (result.error) {
      console.error(result.error);
      return;
    }

    feedContainer.innerHTML = result.data.map(renderPost).join('');
  }

  function renderPost(post) {
    var player = post.players || {};
    var avatar = player.photo_url
      ? '<img src="' + player.photo_url + '" alt="' + (player.full_name || '') + '">'
      : '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(player.full_name || '?') + '&background=E8881A&color=fff" alt="' + (player.full_name || '') + '">';

    var likes = post.likes || [];
    var comments = post.comments || [];

    var likedByMe = !!(currentPlayer && likes.some(function (l) { return l.player_id === currentPlayer.id; }));
    var likeCount = likes.length;

    var commentsHtml = comments.map(function (c) {
      var name = c.players ? c.players.full_name : 'Player';
      return '<div class="feed-comment"><strong>' + name + '</strong> ' + c.comment + '</div>';
    }).join('');

    var pendingTag = post.approved ? '' : '<span class="pending-tag">Pending</span>';

    return (
      '<article class="feed-post" data-post-id="' + post.id + '">' +
        '<div class="feed-post-header">' +
          '<span class="feed-avatar">' + avatar + '</span>' +
          '<div class="feed-who">' +
            '<strong>' + (player.full_name || 'Player') + '</strong>' +
            (player.jersey_number ? '<span>#' + player.jersey_number + '</span>' : '') +
          '</div>' +
          pendingTag +
        '</div>' +
        '<img class="feed-photo" src="' + post.image_url + '" alt="Post by ' + (player.full_name || 'player') + '">' +
        '<div class="feed-actions">' +
          '<button type="button" class="like-btn' + (likedByMe ? ' liked' : '') + '" data-post-id="' + post.id + '">♥ <span class="like-count">' + likeCount + '</span></button>' +
        '</div>' +
        (post.caption ? '<p class="feed-caption">' + post.caption + '</p>' : '') +
        '<div class="feed-comments">' + commentsHtml + '</div>' +
        '<form class="feed-comment-form" data-post-id="' + post.id + '">' +
          '<input type="text" placeholder="Add a comment…" required>' +
          '<button type="submit">Post</button>' +
        '</form>' +
      '</article>'
    );
  }

  if (feedContainer) {
    feedContainer.addEventListener('click', async function (e) {
      var likeBtn = e.target.closest('.like-btn');
      if (!likeBtn || !currentPlayer) return;

      var postId = likeBtn.dataset.postId;
      var alreadyLiked = likeBtn.classList.contains('liked');

      if (alreadyLiked) {
        await supabaseClient.from('likes').delete().eq('post_id', postId).eq('player_id', currentPlayer.id);
      } else {
        await supabaseClient.from('likes').insert([{ post_id: postId, player_id: currentPlayer.id }]);
      }
      loadFeed();
    });

    feedContainer.addEventListener('submit', async function (e) {
      var commentForm = e.target.closest('.feed-comment-form');
      if (!commentForm || !currentPlayer) return;
      e.preventDefault();

      var input = commentForm.querySelector('input');
      var comment = input.value.trim();
      if (!comment) return;

      await supabaseClient.from('comments').insert([{
        post_id: commentForm.dataset.postId,
        player_id: currentPlayer.id,
        comment: comment
      }]);

      loadFeed();
    });
  }


  /* ------------------------------------------------------------------
     4. MEET THE TEAM GRID (public, approved players only)
     ------------------------------------------------------------------ */
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
     5. DONATION FORM VALIDATION + SUPABASE SUBMISSION
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

    donNameInput.addEventListener('blur', validateDonName);
    donPhoneInput.addEventListener('blur', validateDonPhone);
    donAmountInput.addEventListener('blur', validateDonAmount);

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

      donationSubmit.disabled = true;
      donationSubmit.textContent = 'Sending…';

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
            donationSuccess.style.color = '#C23B2E';
            donationSuccess.textContent = 'Something went wrong: ' + result.error.message;
            donationSuccess.classList.add('visible');
          } else {
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
