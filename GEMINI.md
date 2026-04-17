This is a Hackernews Thread Viewer.

It displays one comment at a time in full-screen mode and allows user to swipe to navigate the comment tree.

# Functionality

* Intended to be used on mobile.
* Given a Hackernews item (either as HN URL or number), it displays comments one at a time starting from the first comment.
* A comment being displayed occupies the entire screen. No scrolling.
  * If it's too long, initial view includes a truncated version - double tapping opens a modal with full text and scrolling.
* Swiping left displays the first child comment of the current comment, also entire screen.
* Swiping right displays the parent comment of the current comment, also entire screen.
* Swiping up displays the next "sibling" comment - at the same hierarchy level of comments as current, also entire screen.
* Swiping down displays the previous "sibling" comment, also entire screen.

# Implementation

* Javascript and HTML.
* Should work in browser locally and off of Github Pages.
* HN item is provided as input in the textbox at the top.
* If possible, comments at the same level should have the same visual cue (for example, maybe a background color of header?)
* If possible, make some visual cue change as user drills down deeper and deeper into a comment tree.
  * For example, change some colors from darker to lighter as one drills down.
* Use Hackernews API documentation at https://raw.githubusercontent.com/HackerNews/API/refs/heads/master/README.md

# Guidelines

* Surprise me with UI. Make it functional as described but use your imagination for UI.

