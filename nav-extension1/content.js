// 1. Inject the floating UI
const btn = document.createElement('div');
btn.id = 'navguide-floating-btn';
btn.innerText = '❓';
document.body.appendChild(btn);

const panel = document.createElement('div');
panel.id = 'navguide-panel';
panel.innerHTML = `
  <h4>What do you want to do?</h4>
  <input type="text" id="navguide-input" placeholder="e.g., Change my password">
  <button id="navguide-submit">Guide Me</button>
  <button id="navguide-rescan" style="display:none; background:#ffc107; color:black; margin-bottom:5px;">Scan New Screen</button>
  <button id="navguide-cancel" class="cancel-btn">Cancel Guide</button>
`;
document.body.appendChild(panel);

// Toggle panel
btn.addEventListener('click', () => {
  panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 'block' : 'none';
});

// Cancel active goal
document.getElementById('navguide-cancel').addEventListener('click', () => {
  chrome.storage.local.remove('activeGoal');
  document.getElementById('navguide-rescan').style.display = 'none';
  panel.style.display = 'none';
  alert("Guide cancelled.");
});

// Manual Rescan Override
document.getElementById('navguide-rescan').addEventListener('click', () => {
  panel.style.display = 'none';
  checkActiveGoal();
});

// 2. Scrape Interactive Elements
function getInteractiveElements() {
  const elements = document.querySelectorAll('button, a, input, [role="button"]');
  const elementData = [];

  elements.forEach((el) => {
    if (el.offsetParent !== null && (el.innerText || el.placeholder || el.value || el.name || el.ariaLabel)) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += `#${el.id}`;
      } else if (el.className && typeof el.className === 'string') {
        selector += `.${el.className.split(' ').join('.')}`;
      }

      elementData.push({
        selector: selector,
        text: el.innerText?.trim() || el.placeholder || el.value || el.name || el.ariaLabel || "Unknown",
        type: el.tagName.toLowerCase()
      });
    }
  });
  return elementData;
}

// 3. Process Goal with Backend
async function processGoal(goal) {
  const pageElements = getInteractiveElements();
  
  try {
    const response = await fetch('http://127.0.0.1:8000/get-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: window.location.href, 
        goal: goal,
        elements: pageElements 
      })
    });
    
    const data = await response.json();
    
    if (data.is_complete) {
      chrome.storage.local.remove('activeGoal');
      document.getElementById('navguide-rescan').style.display = 'none';
      alert("You've reached your destination!");
    } else if (data.steps && data.steps.length > 0) {
      startTutorial(data.steps);
    }
  } catch (err) {
    console.error(err);
    alert("Could not connect to the Python server. Ensure it is running.");
  }
}

// 4. Trigger Driver.js Tutorial
function startTutorial(steps) {
  const driverObj = window.driver.js.driver({
    showProgress: true,
    steps: steps.map((step, index) => ({
      element: step.selector,
      popover: {
        title: `Step ${index + 1} of ${steps.length}`, 
        description: step.instruction + "<br><br><i>(Click this element to proceed)</i>",
        side: "left",
        align: 'start'
      }
    }))
  });
  driverObj.drive();

  // AUTO-ADVANCE LOGIC: Intercept user clicks on the target elements
  steps.forEach(step => {
    const el = document.querySelector(step.selector);
    if (el) {
      el.addEventListener('click', () => {
        driverObj.destroy(); // Clear the arrows immediately
        
        // Wait 2 seconds for the resulting modal, dropdown, or page to load, then check again
        setTimeout(checkActiveGoal, 2000);
      }, { once: true }); // 'once: true' ensures this listener fires only one time
    }
  });
}

// 5. Event Listeners for State Persistence
function checkActiveGoal() {
  chrome.storage.local.get(['activeGoal'], (result) => {
    if (result.activeGoal) {
      document.getElementById('navguide-rescan').style.display = 'block';
      setTimeout(() => processGoal(result.activeGoal), 1500); 
    }
  });
}

// Trigger on full page load
window.addEventListener('load', checkActiveGoal);

// Trigger on new user input
document.getElementById('navguide-submit').addEventListener('click', async () => {
  const goal = document.getElementById('navguide-input').value;
  if (!goal) return;
  
  panel.style.display = 'none'; 
  chrome.storage.local.set({ activeGoal: goal }, () => {
    document.getElementById('navguide-rescan').style.display = 'block';
    processGoal(goal);
  });
});