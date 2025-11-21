(async () => {
  // --- CONFIGURATION ---
  const TARGET_USER = '@<insert-username>'; // Your handle
  const SCROLL_INTERVAL = 2000; // Time to wait after scrolling
  const ACTION_DELAY = 600; // Time between clicks (Don't go lower than 500ms)
  
  // --- UI STATUS BAR ---
  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:black;color:white;border:2px solid #1d9bf0;padding:15px;z-index:9999;border-radius:10px;font-family:sans-serif;font-size:14px;min-width:200px;';
  statusDiv.innerHTML = '<strong>X Cleaner Active</strong><br>Deleted: <span id="del-count">0</span><br>Unreposted: <span id="un-count">0</span><br><br><button id="stop-btn" style="background:red;color:white;border:none;padding:5px 10px;cursor:pointer;border-radius:5px;width:100%;">STOP SCRIPT</button>';
  document.body.appendChild(statusDiv);

  let running = true;
  let deleted = 0;
  let unreposted = 0;

  document.getElementById('stop-btn').onclick = () => {
    running = false;
    statusDiv.innerHTML = '<strong>SCRIPT STOPPED</strong>';
    setTimeout(() => statusDiv.remove(), 3000);
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // --- CORE LOGIC ---

  const clickElement = async (selector, textCheck = null) => {
    const elements = Array.from(document.querySelectorAll(selector));
    let target = elements[0];

    if (textCheck) {
      target = elements.find(el => el.textContent.includes(textCheck));
    }

    if (target) {
      target.click();
      return true;
    }
    return false;
  };

  const processTimeline = async () => {
    while (running) {
      const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
      
      if (articles.length === 0) {
        window.scrollTo(0, document.body.scrollHeight);
        await delay(SCROLL_INTERVAL);
        continue;
      }

      let actionTaken = false;

      for (const article of articles) {
        if (!running) break;

        // Scroll article into view to ensure clicks register
        article.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await delay(300); 

        // 1. CHECK FOR REPOST (Green Icons / "unretweet" testid)
        const unretweetBtn = article.querySelector('[data-testid="unretweet"]');
        
        if (unretweetBtn) {
          console.log('Found a repost. Removing...');
          unretweetBtn.click();
          await delay(ACTION_DELAY);
          
          // Click "Undo Repost" in the menu
          const confirmUndo = await clickElement('[data-testid="unretweetConfirm"]');
          if (confirmUndo) {
            unreposted++;
            document.getElementById('un-count').innerText = unreposted;
            article.remove(); // Remove from DOM visually
            actionTaken = true;
            await delay(ACTION_DELAY);
            continue; // Move to next article
          }
        }

        // 2. CHECK FOR MY OWN TWEETS (Menu Caret)
        // We verify it's YOUR tweet by checking for the caret menu inside the article
        const caret = article.querySelector('[data-testid="caret"]');
        
        // We filter to make sure we only delete posts where the handle matches yours logic visually
        // (Extra safety: usually only your tweets have the delete option in the caret menu)
        if (caret) {
          const userHandle = article.innerText.includes(TARGET_USER);
          
          if (userHandle || caret) {
            caret.click();
            await delay(ACTION_DELAY);

            // Look for "Delete" in the dropdown menu
            const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
            const deleteBtn = menuItems.find(el => el.innerText.includes('Delete'));

            if (deleteBtn) {
              console.log('Found own tweet. Deleting...');
              deleteBtn.click();
              await delay(ACTION_DELAY);

              // Click Confirm Delete
              const confirmDel = await clickElement('[data-testid="confirmationSheetConfirm"]');
              if (confirmDel) {
                deleted++;
                document.getElementById('del-count').innerText = deleted;
                article.remove();
                actionTaken = true;
                await delay(ACTION_DELAY);
              }
            } else {
              // If "Delete" isn't there, close the menu (it might be someone else's tweet)
              caret.click(); 
            }
          }
        }
      }

      if (!actionTaken) {
        console.log('No actions possible on current screen. Scrolling...');
        window.scrollBy(0, window.innerHeight * 2);
        await delay(SCROLL_INTERVAL);
        
        // Check if we hit bottom
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            console.log("End of timeline reached.");
            running = false;
            statusDiv.innerHTML = "<strong>Done!</strong>";
        }
      }
    }
  };

  processTimeline();
})();
