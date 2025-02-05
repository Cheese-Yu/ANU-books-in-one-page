// ==UserScript==
// @name         [ANU Books in one page]
// @namespace    http://tampermonkey.net/
// @version      2024-10-01
// @description  Render all pages in one page.
// @author       https://github.com/Cheese-Yu
// @match        https://wattlecourses.anu.edu.au/mod/book/view.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=anu.edu.au
// @grant        GM_notification
// @grant        GM_addStyle
// ==/UserScript==

const cContainer = '#region-main';
const cContent = 'div[role=main]'
const cPrevBtn = '.tertiary-navigation .navitem .btn';
const cNextBtn = '.tertiary-navigation .ml-auto .btn';

let prevFinished = false;
let nextFinished = false;
let max = 0;


// To fetch Content
const getContent = (url) => {
    return new Promise((resolve, reject) => {
        if (!url) resolve(null);
        fetch(url)
            .then(response => {
            // When the page is loaded convert it to text
            resolve(response.text())
        })
            .catch(error => {
            console.error('[Books], Request fail: ', error)
            resolve(null)
        })
    })
};

const renderVideoDom = ($video) => {
    const a = $video.querySelector('a');
    const sourceLink = a && a.getAttribute('href') || $video.innerText;
    if (!sourceLink) return;
    /* $video.src = "" */
    const $iframe = document.createElement('iframe');
    const videoId = new URLSearchParams(sourceLink.split('?')[1]).get('v') || sourceLink.split('/').pop();
    $iframe.src = `https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&showinfo=0&loop=0&fs=0&hl=en&enablejsapi=1&origin=https%3A%2F%2Fwattlecourses.anu.edu.au&widgetid=1`;
    $iframe.setAttribute("width", "100%");
    $iframe.setAttribute("height", "225");
    $iframe.setAttribute("frameborder", "0");
    $iframe.setAttribute("allowfullscreen", "allowfullscreen");

    const $a = document.createElement('a');
    $a.innerHTML = sourceLink;
    $a.href = sourceLink;
    $a.target = "_blanck";
    $a.style.display = 'block';
    // insert iframe
    $video.parentNode.insertBefore($iframe, $video);
    // insert a
    $video.parentNode.insertBefore($a, $video);
    // remove video
    $video.parentNode.removeChild($video);
}

// Fetch next page content
const getNextPage = (doc) => {
    if (!doc) return;

    const $contaniner = document.querySelector(cContainer);
    const $nextBtn = doc.querySelector(cNextBtn);
    const nextLink = $nextBtn && $nextBtn.innerText.includes('Next') && $nextBtn.getAttribute('href');

    if (nextLink) {
        getContent(nextLink).then(html => {
            if (!html) {
                console.warn('[Books], No content.');
                return;
            }
            // Initialize the DOM parser
            const parser = new DOMParser()

            // Parse the text
            const nextDoc = parser.parseFromString(html, "text/html");

            const nextContent = nextDoc.querySelector(cContent);
            const $video = nextDoc.querySelectorAll('video');

            if ($video.length) {
                $video.forEach($video => {
                    renderVideoDom($video);
                })
            }
            $contaniner.appendChild(nextContent)

            getNextPage(nextContent);
        })
    } else {
        // Has finished
        nextFinished = true;
        if (prevFinished) {
            console.log('[Books]=====Finished!')
        }
    }
}

// Fetch previous page content.
const getPrevPage = (doc) => {
    if (!doc) return;

    const $contaniner = document.querySelector(cContainer);
    const $prevBtn = doc.querySelector(cPrevBtn);
    const prevLink = $prevBtn && $prevBtn.innerText.includes('Previous') && $prevBtn.getAttribute('href');

    if (prevLink) {
        getContent(prevLink).then(html => {
            if (!html) {
                console.warn('[Books], No content.');
                return;
            }
            // Initialize the DOM parser
            const parser = new DOMParser()

            // Parse the text
            const prevDoc = parser.parseFromString(html, "text/html");

            const prevContent = prevDoc.querySelector(cContent);
            const $video = prevDoc.querySelectorAll('video');

            if ($video.length) {
                $video.forEach($video => {
                    renderVideoDom($video)
                })
            }

            $contaniner.insertBefore(prevContent, $contaniner.querySelector(cContent));

            getPrevPage(prevContent);
        })
    } else {
        // Has finished
        prevFinished = true;
        if (nextFinished) {
            console.log('[Books]=====Finished!')
        }
    }
}

const addStartButton = () =>{
    const floatButton = document.createElement('div');
    floatButton.innerHTML = 'Run';
    document.body.appendChild(floatButton);
    floatButton.style.cursor = 'pointer';
    floatButton.style.position = 'absolute';
    floatButton.style.right = '30px';
    floatButton.style.bottom = '60px';
    floatButton.style.zIndex = 3000;
    floatButton.style.padding = '6px 14px';
    floatButton.style.backgroundColor = '#b8b9ee';
    floatButton.style.fontWeight = '600';

    floatButton.onclick = doStart
};

const doStart = () => {
    console.log('[Books], Starting...')

    const query = new URLSearchParams(location.search);
    const qId = query.get('id');
    const qChapterid = query.get('chapterid');

    const allContent = document.querySelectorAll(cContent);
    if (allContent.length > 1) {
        GM_notification('The task has been executed. Refresh the page and try again');
        console.log('[Books], The task has been executed. Refresh the page and try again');
        return;
    }

    GM_addStyle('div[role="main"]{margin: 20px 0; border-bottom: dashed 3px #b8b9ee}')
    getPrevPage(document);
    getNextPage(document);
}

(function() {
    'use strict';
    if (location.pathname !== '/mod/book/view.php') return;
    console.log('[Books],===== Start!');
    addStartButton();
})();