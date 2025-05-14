document.addEventListener('DOMContentLoaded', function () {
    // ---- Slet Bekræftelse ----
    const confirmationForms = document.querySelectorAll('form.needs-confirmation');
    if (confirmationForms.length > 0) { console.log(`DEBUG: Found ${confirmationForms.length} confirmation forms.`); }

    confirmationForms.forEach(form => {
        const deleteButton = form.querySelector('button[type="submit"]');
        const formIdentifier = deleteButton ? (deleteButton.title || form.action) : form.action;
        form.addEventListener('submit', function (event) {
            const message = this.dataset.confirmMessage || 'Er du sikker? Handlingen kan ikke fortrydes.';
            if (!confirm(message)) {
                console.log(`DEBUG: Deletion cancelled by user for form: ${formIdentifier}`);
                event.preventDefault();
                event.stopPropagation();
                return false;
            } else {
                console.log(`DEBUG: Deletion confirmed for form: ${formIdentifier}.`);
                if (deleteButton) {
                   deleteButton.disabled = true;
                   deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sletter...';
                }
            }
        });
    });

    // ---- Citer Knap Funktionalitet ----
    const quoteButtons = document.querySelectorAll('.quote-btn');
    const replyTextarea = document.querySelector('#replyPostForm textarea[name="body"]');

    if (replyTextarea && quoteButtons.length > 0) {
        console.log(`DEBUG: Found ${quoteButtons.length} quote buttons and reply textarea.`);
        quoteButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const postId = this.dataset.postId;
                const username = this.dataset.username;
                const postElement = document.getElementById(`post-${postId}`);
                console.log("DEBUG: Quote button clicked for post ID:", postId);

                if (postElement && username) {
                    const postContentElement = postElement.querySelector('.post-content');
                    if (postContentElement) {
                       let originalText = (postContentElement.innerText || '').trim();
                       const maxQuoteLength = 250;
                       if (originalText.length > maxQuoteLength) {
                           originalText = originalText.substring(0, maxQuoteLength).trim() + '...';
                       }
                       const quoteText = `> **${username} skrev:**\n> ${originalText.split('\n').join('\n> ')}\n\n`;

                       const currentVal = replyTextarea.value;
                       const startPos = replyTextarea.selectionStart;
                       replyTextarea.value = quoteText + currentVal;
                       try {
                            replyTextarea.selectionStart = replyTextarea.selectionEnd = quoteText.length + startPos;
                       } catch(e) { /* Ignorer fejl på ældre browsere evt. */ }

                       replyTextarea.focus();
                       replyTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else { console.warn(`Quote Error: Could not find .post-content for #post-${postId}`); }
                 } else { console.warn(`Quote Error: PostElement or Username missing for quote.`); }
             });
         });
     } else {
         if (quoteButtons.length > 0 && !replyTextarea) {
            console.warn("DEBUG: Quote buttons found, but reply textarea is missing.");
         }
     }

     // ---- Scroll-to-reply ----
     const scrollToReplyButton = document.querySelector('.scroll-to-reply');
     const replyFormAnchor = document.getElementById('reply-form');
     if (scrollToReplyButton && replyFormAnchor) {
        scrollToReplyButton.addEventListener('click', (event) => {
            event.preventDefault();
            replyFormAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
     }
});