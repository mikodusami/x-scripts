// Replace with your X username (no @)
const USER = 'your_username_here';

// Delays in ms to avoid blocks
const BASE_DELAY = 1000; // Between actions
const CONFIRM_DELAY = 800; // For dialogs

const deletePosts = () => {
  const articles = Array.from(document.getElementsByTagName('article'));
  const myPosts = articles.filter(article => 
    article.querySelector(`[data-testid="UserAvatar-Container-${USER}"]`)
  );
  
  myPosts.forEach((post, index) => {
    setTimeout(() => {
      const menu = post.querySelector('[data-testid="caret"]') || post.querySelector('[aria-label="More"]');
      if (!menu) return;
      menu.click();
      
      setTimeout(() => {
        const deleteOption = Array.from(document.querySelectorAll('[role="menuitem"]'))
          .find(el => el.textContent.trim() === 'Delete');
        if (!deleteOption) {
          menu.click(); // Close if not found
          return;
        }
        deleteOption.click();
        
        setTimeout(() => {
          const confirmButton = document.querySelector('[data-testid="ocfSettingsListConfirm"]') || 
            document.querySelector('[data-testid="confirmationSheetConfirm"]');
          if (confirmButton) confirmButton.click();
        }, CONFIRM_DELAY);
      }, CONFIRM_DELAY);
    }, index * BASE_DELAY);
  });
  
  // Scroll to load more after processing
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
    // Rerun if needed: deletePosts();
  }, myPosts.length * BASE_DELAY + 500);
};

deletePosts();
