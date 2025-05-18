// Mood Tracker App Script
// This file controls all the logic for your mood tracker web app.
// Comments are added throughout to help me remember and understand each part in future,

// Wait until the HTML page is fully loaded before running any code
// This ensures all elements exist before we try to use them

document.addEventListener('DOMContentLoaded', function() {
  // --- DOM ELEMENTS ---
  // These are references to elements in your HTML so you can interact with them in JS
  const emojiButtons = document.querySelectorAll('.emoji-selector button'); // All mood emoji buttons
  const moodNote = document.getElementById('mood-note'); // The note textarea
  const saveButton = document.getElementById('save-mood'); // The save mood button
  const moodHistory = document.getElementById('mood-history'); // Where mood history is shown
  const timeFilter = document.getElementById('time-filter'); // Dropdown to filter mood history
  const toggleHistoryButton = document.getElementById('toggle-history'); // Collapse/expand history
  const historyContent = document.querySelector('.history-content'); // The collapsible content
  const moodBarGraphEl = document.getElementById('mood-bar-graph'); // Mood bar graph container
  const barGraphEmotionFilter = document.getElementById('bar-graph-emotion'); // Filter for bar graph
  const timeFilterEl = document.getElementById('time-filter'); // Another reference to the time filter
  const toggleChartButton = document.getElementById('toggle-chart');
  const graphContent = document.querySelector('.graph-content');

  // --- MOOD META DATA ---
  // This object maps mood keys to their labels and emoji
  const MOOD_META = {
    'very-happy': { label: 'Very Happy', emoji: '😄' },
    'happy': { label: 'Happy', emoji: '😊' },
    'calm': { label: 'Calm', emoji: '😌' },
    'neutral': { label: 'Neutral', emoji: '😐' },
    'sad': { label: 'Sad', emoji: '😢' },
    'angry': { label: 'Angry', emoji: '😠' },
    'anxious': { label: 'Anxious', emoji: '😰' },
    'tired': { label: 'Tired', emoji: '😴' }
  };

  // --- APP STATE ---
  // This keeps track of which moods are currently selected
  let selectedMoods = new Set();
  let isHistoryCollapsed = false; // For toggling mood history

  // --- EVENT LISTENERSS ---
  // Add click listeners to each emoji button so you can select/deselect moods
  emojiButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mood = button.dataset.mood;
      if (selectedMoods.has(mood)) {
        selectedMoods.delete(mood);
        button.classList.remove('selected');
      } else {
        selectedMoods.add(mood);
        button.classList.add('selected');
      }
    });
  });

  // When you click the save button, save the mood
  saveButton.addEventListener('click', saveMood);
  // When you change the time filter, update the mood history
  timeFilter.addEventListener('change', displayMoodHistory);
  // Toggle mood history section open/closed
  toggleHistoryButton.addEventListener('click', () => {
    isHistoryCollapsed = !isHistoryCollapsed;
    historyContent.classList.toggle('collapsed', isHistoryCollapsed);
    toggleHistoryButton.classList.toggle('open', !isHistoryCollapsed);
  });

  // Add event listener for clear history button
  const clearHistoryBtn = document.getElementById('clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your entire mood history? This cannot be undone.')) {
        localStorage.removeItem('moods');
        displayMoodHistory();
        updateStreakBadge();
        renderMoodBarGraph();
      }
    });
  }

  // --- MOOD STREAK BADGE ---
  // Shows a badge if you have a streak of 3+ days logging moods
  function updateStreakBadge() {
    const moods = JSON.parse(localStorage.getItem('moods') || '[]');
    const dateSet = new Set(moods.map(m => new Date(m.date).toISOString().slice(0, 10)));
    if (dateSet.size === 0) {
      document.getElementById('streak-badge').style.display = 'none';
      return;
    }
    const dates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    let prev = new Date(dates[0]);
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        prev = curr;
      } else {
        break;
      }
    }
    const badge = document.getElementById('streak-badge');
    if (streak >= 1) {
      badge.textContent = `🔥 ${streak}-Day Mood Streak!`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  // --- ROSE BLOOM ANIMATION ---
  // Shows a blooming rose animation when 'calm' mood is saved
  function showGrowingFlower() {
    const flowerDiv = document.createElement('div');
    flowerDiv.className = 'growing-rose';
    flowerDiv.innerHTML = `
      <svg width="140" height="180" viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="roseCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff0f5"/>
            <stop offset="100%" stop-color="#e63946"/>
          </radialGradient>
          <linearGradient id="rosePetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e63946"/>
            <stop offset="100%" stop-color="#b51734"/>
          </linearGradient>
          <linearGradient id="roseStem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#43aa8b"/>
            <stop offset="100%" stop-color="#155843"/>
          </linearGradient>
        </defs>
        <rect class="rose-stem" x="65" y="90" width="10" height="70" rx="5" fill="url(#roseStem)"/>
        <ellipse class="rose-petal petal1" cx="70" cy="80" rx="38" ry="28" fill="url(#rosePetal)"/>
        <ellipse class="rose-petal petal2" cx="70" cy="60" rx="30" ry="22" fill="url(#rosePetal)"/>
        <ellipse class="rose-petal petal3" cx="70" cy="50" rx="22" ry="16" fill="url(#rosePetal)"/>
        <ellipse class="rose-center" cx="70" cy="50" rx="12" ry="10" fill="url(#roseCenter)"/>
      </svg>
    `;
    document.body.appendChild(flowerDiv);
    // Animate the rose in stages
    setTimeout(() => flowerDiv.classList.add('bloom-stem'), 10);
    setTimeout(() => flowerDiv.classList.add('bloom-petals'), 400);
    setTimeout(() => flowerDiv.classList.add('bloom-center'), 700);
    setTimeout(() => flowerDiv.remove(), 2200);
  }

  // --- CONFETTI ANIMATION ---
  // Shows confetti for happy/very-happy moods, and rose for calm
  function launchConfettiForMood(moods) {
    console.log('Launching confetti/flower for moods:', moods);
    if ((moods.includes('happy') || moods.includes('very-happy')) && typeof confetti !== 'undefined') {
      confetti({
        particleCount: 50,
        spread: 60,
        startVelocity: 35,
        origin: { y: 0.7 },
        scalar: 0.85,
        ticks: 180,
        colors: ['#2055c9', '#6f42c1', '#ffc107', '#28a745', '#dc3545']
      });
    } else if ((moods.includes('happy') || moods.includes('very-happy')) && typeof confetti === 'undefined') {
      console.warn('confetti is not defined!');
    }
    if (moods.includes('calm')) {
      console.log('Showing flower for calm mood');
      showGrowingFlower();
    }
  }

  // --- MOOD EMOJI ANIMATIONS ---
  // Adds a fun animation to the emoji button when you save a mood
  function animateMoodEmoji(mood) {
    const btn = document.querySelector(`.emoji-selector button[data-mood="${mood}"]`);
    if (!btn) {
      console.error(`animateMoodEmoji: No button found for mood: ${mood}`);
      return;
    }
    const effect = document.createElement('div');
    effect.className = `mood-anim mood-anim-${mood}`;
    // Add different effects for each mood
    switch (mood) {
      case 'very-happy':
        effect.innerHTML = '<div class="burst"></div>';
        break;
      case 'happy':
        effect.innerHTML = '<div class="sparkle sparkle1"></div><div class="sparkle sparkle2"></div><div class="sparkle sparkle3"></div>';
        break;
      case 'neutral':
        effect.innerHTML = '<div class="ripple"></div>';
        break;
      case 'sad':
        effect.innerHTML = '<div class="raindrop drop1"></div><div class="raindrop drop2"></div><div class="raindrop drop3"></div>';
        break;
      case 'angry':
        effect.innerHTML = '<div class="shockwave"></div>';
        break;
      case 'anxious':
        effect.innerHTML = '<div class="wavy"></div>';
        break;
      case 'tired':
        effect.innerHTML = '<div class="zzz z1">Z</div><div class="zzz z2">z</div><div class="zzz z3">z</div>';
        break;
      // calm handled by rose bloom
    }
    btn.style.position = 'relative';
    btn.appendChild(effect);
    setTimeout(() => effect.remove(), 1400);
  }

  // --- AFTER MOOD SAVE ---
  // Called after a mood is saved to update UI and trigger animations
  function afterMoodSave(moodEntry) {
    updateStreakBadge();
    renderMoodBarGraph();
    if (moodEntry && Array.isArray(moodEntry.moods)) {
      launchConfettiForMood(moodEntry.moods);
      moodEntry.moods.forEach(mood => {
        if (mood !== 'calm') animateMoodEmoji(mood);
      });
    }
  }

  // --- INITIAL LOAD ---
  // Show streak badge and bar graph when the page loads
  updateStreakBadge();
  renderMoodBarGraph();

  // --- SAVE MOOD FUNCTION ---
  // This is the main function that runs when you click 'Save Mood'
  function saveMood() {
    if (selectedMoods.size === 0) {
      const errorDiv = document.getElementById('mood-error');
      errorDiv.textContent = 'Please select at least one mood! ☺️';
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }, 2500);
      return;
    }

    try {
      // Log selected moods for debugging
      console.log('Selected moods:', Array.from(selectedMoods));
      // Look up the emoji for each selected mood
      const emojis = Array.from(selectedMoods).map(mood => {
        const btn = document.querySelector(`[data-mood="${mood}"]`);
        if (!btn) {
          console.error(`No button found for mood: ${mood}`);
        } else {
          console.log(`Button found for mood: ${mood}, emoji: ${btn.textContent.trim()}`);
        }
        if (btn && btn.textContent.trim()) {
          return btn.textContent.trim();
        } else {
          console.error(`Could not find emoji for mood: ${mood}`);
          return '❓';
        }
      });
      console.log('Emoji lookup result:', emojis);
      if (emojis.includes('❓')) {
        alert('There was an error finding the emoji for your mood. Please refresh and try again.');
        return;
      }

      // Create a mood entry object
      const moodEntry = {
        moods: Array.from(selectedMoods),
        emojis: emojis,
        note: moodNote.value.trim(),
        date: new Date().toISOString()
      };
      console.log('Mood entry to save:', moodEntry);

      // Get existing moods from localStorage
      let moods = [];
      try {
        const storedMoods = localStorage.getItem('moods');
        if (storedMoods) {
          moods = JSON.parse(storedMoods);
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        alert('Error reading saved moods. Please try again.');
        return;
      }
      console.log('Current moods in localStorage:', moods);

      // Add new mood entry to the array
      moods.push(moodEntry);

      // Save updated moods array to localStorage
      try {
        localStorage.setItem('moods', JSON.stringify(moods));
        console.log('Successfully saved moods to localStorage.');
      } catch (error) {
        console.error('Error saving to localStorage:', error, { moods });
        alert('There was an error saving your mood. Please try again.');
        return;
      }

      // Reset the form for the next entry
      emojiButtons.forEach(btn => btn.classList.remove('selected'));
      moodNote.value = '';
      selectedMoods.clear();

      // Update the UI
      displayMoodHistory();
      afterMoodSave(moodEntry); // Pass the entry for confetti/flowers

      // Show a success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Mood saved successfully!';
      document.querySelector('.mood-input-section').appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 2000);

    } catch (error) {
      // Log the error for debugging
      console.error('Error in saveMood (outer catch):', error);
      alert('There was an error saving your mood. Please try again.');
    }
  }

  // --- DISPLAY MOOD HISTORY ---
  // Shows your mood history in the UI, filtered by time
  function displayMoodHistory() {
    try {
      console.log('Starting to display mood history...');
      const storedMoods = localStorage.getItem('moods');
      console.log('Raw stored moods:', storedMoods);
      if (!storedMoods) {
        console.log('No moods found in localStorage');
        moodHistory.innerHTML = '<div class="no-moods">No moods recorded yet</div>';
        return;
      }
      let moods;
      try {
        moods = JSON.parse(storedMoods);
        console.log('Parsed moods:', moods);
      } catch (parseError) {
        console.error('Error parsing moods:', parseError);
        moodHistory.innerHTML = '<div class="error-message">Error parsing saved moods</div>';
        return;
      }
      if (!Array.isArray(moods)) {
        console.error('Stored moods is not an array:', moods);
        moodHistory.innerHTML = '<div class="error-message">Invalid mood data format</div>';
        return;
      }
      const filterValue = timeFilter.value;
      console.log('Filter value:', filterValue);
      // Filter moods based on selected time period
      const filteredMoods = moods.filter(mood => {
        try {
          const moodDate = new Date(mood.date);
          const now = new Date();
          if (filterValue === 'all') return true;
          if (filterValue === 'today') {
            return moodDate.toDateString() === now.toDateString();
          }
          if (filterValue === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            return moodDate.toDateString() === yesterday.toDateString();
          }
          if (filterValue === '3') {
            const diffTime = Math.abs(now - moodDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 3;
          }
          if (filterValue === '7') {
            const diffTime = Math.abs(now - moodDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
          }
          if (filterValue === '30') {
            const diffTime = Math.abs(now - moodDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
          }
          return false;
        } catch (dateError) {
          console.error('Error processing date:', dateError, mood);
          return false;
        }
      });
      console.log('Filtered moods:', filteredMoods);
      // Sort moods by date (newest first)
      filteredMoods.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (filteredMoods.length === 0) {
        moodHistory.innerHTML = '<div class="no-moods">No moods recorded for this period</div>';
        return;
      }
      // Display moods in the UI
      const moodHTML = filteredMoods.map(mood => {
        try {
          return `
            <div class="mood-entry">
              <div class="emojis">${mood.emojis.join(' ')}</div>
              <div class="details">
                <div class="date">${formatDate(mood.date)}</div>
                ${mood.note ? `<div class="note">${mood.note}</div>` : ''}
              </div>
            </div>
          `;
        } catch (renderError) {
          console.error('Error rendering mood entry:', renderError, mood);
          return '';
        }
      }).join('');
      moodHistory.innerHTML = moodHTML;
      console.log('Mood history updated successfully');
    } catch (error) {
      console.error('Error displaying mood history:', error);
      moodHistory.innerHTML = '<div class="error-message">Error loading mood history</div>';
    }
  }

  // --- FORMAT DATE ---
  // Converts a date string to a nice readable format
  function formatDate(dateString) {
    try {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  }

  // --- LIVE DATE AND TIME DISPLAY ---
  // Shows the current date and time in the header, updating every second
  function updateDateTime() {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    const el = document.getElementById('current-datetime');
    if (el) {
      el.textContent = now.toLocaleString(undefined, options);
    }
  }
  setInterval(updateDateTime, 1000);
  updateDateTime();

  // Initial display of mood history
  displayMoodHistory();

  // --- MOOD HEALTH BAR GRAPH ---
  // Shows a horizontal bar graph of mood frequency, filtered by time and emotion
  function getFilteredMoods() {
    const moods = JSON.parse(localStorage.getItem('moods') || '[]');
    const filterValue = timeFilterEl.value;
    const now = new Date();
    return moods.filter(mood => {
      try {
        const moodDate = new Date(mood.date);
        if (filterValue === 'all') return true;
        if (filterValue === 'today') return moodDate.toDateString() === now.toDateString();
        if (filterValue === 'yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return moodDate.toDateString() === yesterday.toDateString();
        }
        if (['3','7','30'].includes(filterValue)) {
          const days = parseInt(filterValue);
          const diffTime = Math.abs(now - moodDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= days;
        }
        return false;
      } catch {
        return false;
      }
    });
  }

  // Renders the bar graph in the UI
  function renderMoodBarGraph() {
    const filteredMoods = getFilteredMoods();
    const emotionFilter = barGraphEmotionFilter.value;
    // Count frequency for each mood
    const moodCounts = {};
    filteredMoods.forEach(entry => {
      if (entry.moods && Array.isArray(entry.moods)) {
        entry.moods.forEach(mood => {
          if (emotionFilter === 'all' || mood === emotionFilter) {
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          }
        });
      }
    });
    // If filtering by emotion, only show that mood
    const moodsToShow = emotionFilter === 'all' ? Object.keys(MOOD_META) : [emotionFilter];
    // Find max count for scaling
    const maxCount = Math.max(1, ...Object.values(moodCounts));
    // Build HTML for each bar
    moodBarGraphEl.innerHTML = moodsToShow.map(mood => {
      const count = moodCounts[mood] || 0;
      const percent = (count / maxCount) * 100;
      const meta = MOOD_META[mood];
      return `
        <div class="mood-bar-row">
          <span class="mood-bar-label">${meta.emoji} ${meta.label}</span>
          <div class="mood-bar">
            <div class="mood-bar-fill ${mood}" style="width: ${percent}%;"></div>
          </div>
          <span class="mood-bar-count">${count}</span>
        </div>
      `;
    }).join('');
  }

  // Update bar graph when filters change
  if (barGraphEmotionFilter) barGraphEmotionFilter.addEventListener('change', renderMoodBarGraph);
  if (timeFilterEl) timeFilterEl.addEventListener('change', renderMoodBarGraph);

  // --- THEME TOGGLE LOGIC ---
  // Lets you switch between light and neon themes
  const themeToggleBtn = document.getElementById('theme-toggle');
  const THEME_KEY = 'mood-theme';

  // Set the theme (light or neon)
  function setTheme(theme) {
    document.body.classList.remove('theme-neon');
    if (theme === 'theme-neon') {
      document.body.classList.add('theme-neon');
    }
    localStorage.setItem(THEME_KEY, theme);
    // Update toggle icon/label
    if (themeToggleBtn) {
      if (theme === 'theme-neon') {
        themeToggleBtn.innerHTML = '🟣 Neon';
      } else {
        themeToggleBtn.innerHTML = '⚪️ Light';
      }
    }
  }

  // Toggle between themes
  function toggleTheme() {
    const isNeon = document.body.classList.contains('theme-neon');
    setTheme(isNeon ? 'theme-light' : 'theme-neon');
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  // On load, set theme from localStorage or default to light
  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    setTheme(saved === 'theme-neon' ? 'theme-neon' : 'theme-light');
  })();

  // Chart toggle functionality
  toggleChartButton.addEventListener('click', () => {
    graphContent.classList.toggle('collapsed');
    toggleChartButton.classList.toggle('open');
  });

  // --- END OF SCRIPT ---
  // All your app logic is now commented for easy learning!
});
