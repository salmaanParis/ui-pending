// Define global variables
let executionAllowed = true; // Global variable to track execution status
let countdownInterval; // Variable to hold the countdown interval

// Add event listener for the "Terminate" button
document.getElementById('terminateButton').addEventListener('click', () => {
    // Set executionAllowed to false to terminate execution
    executionAllowed = false;

    // Clear the countdown interval
    clearInterval(countdownInterval);

        // Reset checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = false;
      });

    // Optionally, hide the countdown element
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        countdownElement.style.display = 'none';
    }
});



////////////////////////////////////////////////////////////////////////////////////////////////////////
document.getElementById('doneButton').addEventListener('click', async () => {
  if (!executionAllowed) {
    alert('Execution terminated.');
    return;
}
  const checkAllLinks = document.getElementById('checkAllLinks').checked;
  const checkBrokenLinks = document.getElementById('checkBrokenLinks').checked;
  const checkLocalLanguageLinks = document.getElementById('checkLocalLanguageLinks').checked;
  const checkAllDetails = document.getElementById('checkAllDetails').checked;
  const checkHeading = document.getElementById('checkHeading').checked;
  const ariaCheck = document.getElementById('ariaCheck').checked;
  const imageCheck = document.getElementById('imageCheck').checked;
  const checkMeta = document.getElementById('metaCheck').checked;
  const checkAka = document.getElementById('akaCheck').checked;
  const checkRedirect = document.getElementById('redirectCheck').checked;

  if (!checkAllLinks && !checkBrokenLinks && !checkLocalLanguageLinks && !checkAllDetails && !checkHeading && !ariaCheck && !imageCheck && !checkMeta && !checkAka && !checkRedirect) {
    alert('Please check at least one checkbox.');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.startsWith('chrome://')) {
    alert('This extension cannot be run on chrome:// URLs.');
    return;
  }

  let countdownTime = 300; // Set countdown time in seconds (5 minutes)
  const countdownElement = document.getElementById('countdown');
  countdownElement.style.display = 'block'; // Ensure countdown element is visible
  updateCountdown(countdownElement, countdownTime);

  const countdownInterval = setInterval(() => {
    countdownTime -= 1;
    updateCountdown(countdownElement, countdownTime);

    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      countdownElement.textContent = 'Time is up!';
    }
  }, 1000);

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: checkLinks,
      args: [checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails, checkHeading, ariaCheck, imageCheck,checkMeta, checkAka, checkRedirect]
    });

    console.log('Link check result:', result); // Debugging

    if (result) {
      localStorage.setItem('linkResults', JSON.stringify(result));
      clearInterval(countdownInterval);
      countdownElement.textContent = 'Loading completed. Now you can download your files';
      alert('Completed');
    } else {
      alert('No result returned from the link check.');
    }
  } catch (error) {
    clearInterval(countdownInterval);
    countdownElement.textContent = '';
    console.error(error);
    alert('An error occurred while checking links.');
  }
});

function updateCountdown(element, time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  element.textContent = `Time remaining: ${minutes}m ${seconds}s`;
}

document.getElementById('previewButton').addEventListener('click', () => {
  const results = JSON.parse(localStorage.getItem('linkResults'));
  if (results) {
    document.getElementById('result').style.display = 'block';
    displayAllLinks(results.allLinks);
    displayBrokenLinks(results.brokenLinks);
    displayLocalLanguageLinks(results.localLanguageLinks);
    displayHeading(results.headingHierarchy);
    displayAria(results.ariaDetails);
    displayImages(results.imageDetails);
    displayMeta(results.metaDetails);
    displayAkaLinks(results.akaLinks);
    displayRedirectLinks(results.redirectLinks);
  } else {
    alert('No data to preview. Please click "Generate" first.');
  }
});


document.getElementById('downloadExcelButton').addEventListener('click', () => {
  // Retrieve data directly from the DOM
  const results = JSON.parse(localStorage.getItem('linkResults'));
  if (results) {
  const allLinksData = [["URL", "Status"]].concat(
    Array.from(document.querySelectorAll('#allLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
    if (allLinksData.length <= 1) { // Length will be 1 if there's only the header row
    alert('No data available to download.');
    return;
  }

  const brokenLinksData = [["URL", "Status"]].concat(
    Array.from(document.querySelectorAll('#brokenLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  const localLanguageLinksData = [["URL", "Text"]].concat(
    Array.from(document.querySelectorAll('#localLanguageLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const headingsData = [["Tag", "Text"]].concat(
    Array.from(document.querySelectorAll('#headingTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  const ariaData = [["Element", "ARIA Label", "Link"]].concat(
    Array.from(document.querySelectorAll('#ariaTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  const imageData = [["Source", "Alt Text"]].concat(
    Array.from(document.querySelectorAll('#imageTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  const metaData = [["Tag Name", "Content Value"]].concat(
    Array.from(document.querySelectorAll('#metaTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  const akaData = [["URL"]].concat(
    Array.from(document.querySelectorAll('#akaTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );

  // Workbook creation
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Link Report",
    Subject: "Link Checker",
    Author: "Your Name",
    CreatedDate: new Date()
  };

  // Convert each table data to sheets
  const allLinksSheet = XLSX.utils.aoa_to_sheet(allLinksData);
  const brokenLinksSheet = XLSX.utils.aoa_to_sheet(brokenLinksData);
  const localLanguageLinksSheet = XLSX.utils.aoa_to_sheet(localLanguageLinksData);
  const headingsSheet = XLSX.utils.aoa_to_sheet(headingsData);
  const ariaSheet = XLSX.utils.aoa_to_sheet(ariaData);
  const imageSheet = XLSX.utils.aoa_to_sheet(imageData);
  const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
  const akaSheet = XLSX.utils.aoa_to_sheet(akaData);

  // Append each sheet to the workbook
  XLSX.utils.book_append_sheet(wb, allLinksSheet, "All Links");
  XLSX.utils.book_append_sheet(wb, brokenLinksSheet, "Broken Links");
  XLSX.utils.book_append_sheet(wb, localLanguageLinksSheet, "Local Language Links");
  XLSX.utils.book_append_sheet(wb, headingsSheet, "Headings");
  XLSX.utils.book_append_sheet(wb, ariaSheet, "ARIA Label Details");
  XLSX.utils.book_append_sheet(wb, imageSheet, "Image Details");
  XLSX.utils.book_append_sheet(wb, metaSheet, "Page Property Details");
  XLSX.utils.book_append_sheet(wb, akaSheet, "Short URL Details");

  // Trigger the download
  XLSX.writeFile(wb, 'links_report.xlsx');
} else {
  alert('No data to download. Please click "Generate" first.');
}
});

 /////////////////////////////////WORK-SHEET OF GENERATE XLSX DOWNLOAD////////////////////////////////////////////////////////-E


//compare functionalities////////////////////////////////////////////////////////

async function comparePages() {
  const targetUrl = document.getElementById('compare-url').value;
  if (!targetUrl) {
      alert('Please enter a URL to compare.');
      return;
  }

  let countdownTime = 300; // Set countdown time in seconds (5 minutes)
  const countdownElement = document.getElementById('countdown');
  countdownElement.style.display = 'block'; // Ensure countdown element is visible
  updateCountdown(countdownElement, countdownTime);

  const countdownInterval = setInterval(() => {
      countdownTime -= 1;
      updateCountdown(countdownElement, countdownTime);

      if (countdownTime <= 0) {
          clearInterval(countdownInterval);
          countdownElement.textContent = 'Time is up!';
          document.getElementById('loadingComplete').style.display = 'block'; // Show "Loading complete" message
      }
  }, 1000);

  // Fetch current page content
  const currentTab = await getCurrentTab();
  const currentUrl = currentTab.url;
  const currentResponse = await fetch(currentUrl);
  const currentPageHTML = await currentResponse.text();
  const currentDoc = new DOMParser().parseFromString(currentPageHTML, 'text/html');
  const currentPageContent = extractPageContent(currentDoc);

  // Fetch target page content
  const targetResponse = await fetch(targetUrl);
  const targetPageHTML = await targetResponse.text();
  const targetDoc = new DOMParser().parseFromString(targetPageHTML, 'text/html');
  const targetPageContent = extractPageContent(targetDoc);

  // Compare and display differences
  displayDifferences(currentPageContent, targetPageContent);
  document.getElementById('comparisonResults').style.display = 'block'; // Show the result section

  // Stop the timer and hide it
  clearInterval(countdownInterval);
  countdownElement.style.display = 'none';
}


document.getElementById('compare-button').addEventListener('click', comparePages);
document.getElementById('downloadComparisonButton').addEventListener('click', downloadExcel);
////////////////////////////////////////////////////////////////////////////////////////
// async function comparePages() {
//   const targetUrl = document.getElementById('compare-url').value;
//   if (!targetUrl) {
//     alert('Please enter a URL to compare.');
//     return;
//   }

//   // Fetch current page content
//   const currentTab = await getCurrentTab();
//   const currentUrl = currentTab.url;
//   const currentResponse = await fetch(currentUrl);
//   const currentPageHTML = await currentResponse.text();
//   const currentDoc = new DOMParser().parseFromString(currentPageHTML, 'text/html');
//   const currentPageContent = extractPageContent(currentDoc);

//   // Fetch target page content
//   const targetResponse = await fetch(targetUrl);
//   const targetPageHTML = await targetResponse.text();
//   const targetDoc = new DOMParser().parseFromString(targetPageHTML, 'text/html');
//   const targetPageContent = extractPageContent(targetDoc);

//   // Compare and display differences
//   displayDifferences(currentPageContent, targetPageContent);
// }

async function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0]);
    });
  });
}

function extractPageContent(doc) {
  const content = {
    textFields: [],
    ariaLinks: [],
    images: [],
    metaTags:[],
    header: []
  };

  doc.querySelectorAll('h1, h2, p, a').forEach(el => {
    // Replace \n and \t with empty string, then trim and push inner text
    content.textFields.push(el.innerText.replace(/\n/g, '').replace(/\t/g, '').trim());
  });

  doc.querySelectorAll('[aria-label]').forEach(el => {
    content.ariaLinks.push({
      link: el.getAttribute('href'),
      label: el.getAttribute('aria-label'),
      target: el.getAttribute('target')
    });
  });

  doc.querySelectorAll('img').forEach(img => {
    content.images.push({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt')
    });
  });

  doc.querySelectorAll('meta').forEach(meta => {
    const tagName = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
    const contentValue = meta.getAttribute('content');

    if (tagName && contentValue) {
        content.metaTags.push({ tagName, contentValue });
    }
});

// doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
//   content.header.push({
//     tag: header.tagName.toLowerCase(),
//     text: header.innerText
//   });
// });

doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
  content.header.push({
    tag: header.tagName.toLowerCase(),
    text: header.innerText.replace(/\n/g, '').trim()
  });
});


  return content;
}

function displayDifferences(current, target) {
  displayTable('text-comparison', current.textFields, target.textFields);
  displayTable('aria-comparison', current.ariaLinks, target.ariaLinks);
  displayTable('images-comparison', current.images, target.images);
  displayTable('meta-comparison', current.metaTags, target.metaTags);
  displayTable('head-comparison', current.header, target.header);
}

function displayTable(tableId, currentData, targetData) {
  const tbody = document.getElementById(tableId).querySelector('tbody');
  tbody.innerHTML = '';

  const maxLength = Math.max(currentData.length, targetData.length);
  for (let i = 0; i < maxLength; i++) {
    const row = document.createElement('tr');
    const currentCell = document.createElement('td');
    const targetCell = document.createElement('td');

    const currentContent = currentData[i] ? JSON.stringify(currentData[i]) : '';
    const targetContent = targetData[i] ? JSON.stringify(targetData[i]) : '';

    currentCell.innerText = currentContent;
    targetCell.innerText = targetContent;

    if (currentContent !== targetContent) {
      // Highlight the cells where the content is different
      currentCell.style.backgroundColor = 'lightcoral';
      targetCell.style.backgroundColor = 'lightcoral';
    }

    row.appendChild(currentCell);
    row.appendChild(targetCell);
    tbody.appendChild(row);
  }
}

function downloadExcel() {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Comparison Report",
    Subject: "Page Comparison",
    Author: "Your Name",
    CreatedDate: new Date()
  };

  /////////////////////////////////WORK-SHEET OF COMPARISON XLSX DOWNLOAD/////////////////////////////////////////////-S
  // Convert text fields comparison to worksheet
  const textComparisonData = [["Current Page", "Target Page"]].concat(
    Array.from(document.querySelectorAll('#text-comparison tbody tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const textComparisonSheet = XLSX.utils.aoa_to_sheet(textComparisonData);
  XLSX.utils.book_append_sheet(wb, textComparisonSheet, "Text Fields Comparison");

  // Convert aria-label links comparison to worksheet
  const ariaComparisonData = [["Current Page", "Target Page"]].concat(
    Array.from(document.querySelectorAll('#aria-comparison tbody tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const ariaComparisonSheet = XLSX.utils.aoa_to_sheet(ariaComparisonData);
  XLSX.utils.book_append_sheet(wb, ariaComparisonSheet, "ARIA-label Links Comparison");

  // Convert images comparison to worksheet
  const imagesComparisonData = [["Current Page", "Target Page"]].concat(
    Array.from(document.querySelectorAll('#images-comparison tbody tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const imagesComparisonSheet = XLSX.utils.aoa_to_sheet(imagesComparisonData);
  XLSX.utils.book_append_sheet(wb, imagesComparisonSheet, "Images Comparison");

  // Convert meta tag comparison to worksheet
  const metaComparisonData = [["Current Page", "Target Page"]].concat(
    Array.from(document.querySelectorAll('#meta-comparison tbody tr')).map(row => {
        return Array.from(row.cells).map(cell => cell.textContent);
    })
);
const metaComparisonSheet = XLSX.utils.aoa_to_sheet(metaComparisonData);
XLSX.utils.book_append_sheet(wb, metaComparisonSheet, "Meta Tags Comparison");

  XLSX.writeFile(wb, 'comparison_report.xlsx');
}
 /////////////////////////////////WORK-SHEET XLSX DOWNLOAD////////////////////////////////////////////////////////////-E
//clear Button
document.getElementById('clear').addEventListener('click', () => {
  localStorage.removeItem('linkResults');
  document.getElementById('result').style.display = 'none';
  document.getElementById('comparisonResults').style.display = 'none'; // Hide the result section after clearing
  
  // Uncheck all checkboxes/////////////////////////////////////////////////Clear
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////Functions for check BOXES
function displayAllLinks(links) {
  let html = '<table><tr><th>All Links</th><th>Status</th></tr>';
  links.forEach(link => {
    const statusColor = link.status === 200 ? 'green' : 'red';
    const linkClass = link.url.includes('#') ? 'highlighted-link' : ''; // Add class if URL contains '#'
    html += `<tr><td class="${linkClass}">${link.url}</td><td style="color: ${statusColor};">${link.status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('allLinksTable').innerHTML = html;

}

function displayBrokenLinks(links) {
  let html = '<table><tr><th>Broken Links</th><th>Status</th></tr>';
  links.forEach(link => {
    const statusColor = link.status === 200 ? 'green' : 'red';
    html += `<tr><td>${highlightPercent20(link.url)}</td><td style="color: ${statusColor};">${link.status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('brokenLinksTable').innerHTML = html;

}

function displayLocalLanguageLinks(links) {
  let html = '<table><thead><tr><th>Links</th><th>Region Specific</th><th>Link Text</th></tr></thead><tbody>';
  links.forEach(link => {
    const linkElement = document.createElement('a');
    linkElement.href = link.url;
    linkElement.textContent = link.text; // Extracting link text from the anchor element
    const linkText = linkElement.innerHTML; // Using innerHTML to get the rendered HTML content of the anchor element
    html += `<tr><td>${link.url}</td><td>${getLocalLanguageString(link.url)}</td><td>${linkText}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('localLanguageLinksTable').innerHTML = html;
}

function displayHeading(headings) {
  if (headings && headings.length > 0) {
    // Sort headings based on the heading tag (h1, h2, ...)
    headings.sort((a, b) => {
      const tagA = parseInt(a.tag.replace('h', ''));
      const tagB = parseInt(b.tag.replace('h', ''));
      return tagA - tagB;
    });

    let headingHtml = '<table><tr><th>Heading Tag</th><th>Text</th></tr>';
    headings.forEach(heading => {
      headingHtml += `<tr><td>${heading.tag}</td><td>${heading.text}</td></tr>`;
    });
    headingHtml += '</table>';
    document.getElementById('headingTable').innerHTML = headingHtml;
  }
}
  

function displayAria(ariaDetails) {
  let html = '<table><tr><th>Element</th><th>ARIA Label</th><th>Link';
  ariaDetails.forEach(detail => {
    html += `<tr><td>${detail.element}</td><td>${detail.ariaLabel}</td><td>${detail.link}`;
  });
  html += '</table>';
  document.getElementById('ariaTable').innerHTML = html;
}

function displayImages(imageDetails) {
  let html = '<table><tr><th>Image Source</th><th>Alt Text</th></tr>';
  imageDetails.forEach(detail => {
    html += `<tr><td>${detail.src}</td><td>${detail.alt}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('imageTable').innerHTML = html;
}

function displayMeta(metaDetails) {
  let html = '<table><tr><th>Tag Name</th><th>Content Value</th></tr>';
  metaDetails.forEach(meta => {
      html += `<tr><td>${meta.tagName}</td><td>${meta.content}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('metaTable').innerHTML = html;
}


function displayAkaLinks(akaLinks) {
  let html = '<table><tr><th>URL</th></tr>';
  akaLinks.forEach(link => {
    html += `<tr><td>${link.url}</td></tr>`; // Display only the URL
  });
  html += '</table>';
  document.getElementById('akaTable').innerHTML = html;
}

function displayRedirectLinks(redirectLinks) {
  let html = '<table><tr><th>Redirect Links</th><th>Status</th></tr>';
  redirectLinks.forEach(link => {
    const statusColor = link.status === 200 ? 'green' : 'red';
    html += `<tr><td>${highlightPercent20(link.url)}</td><td style="color: ${statusColor};">${link.status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('redirectTable').innerHTML = html;

}




function getLocalLanguageString(url) {
  const localLanguageList = [
    'en-us', 'en-au', 'en-ca', 'en-gb', 'en-hk', 'en-ie', 'en-in', 'en-my', 'en-nz', 'en-ph', 'en-sg', 'en-za', 'es-es',
    'es-mx', 'fr-be', 'fr-ca', 'fr-fr', 'it-it', 'ko-kr', 'pt-br', 'de-de', 'ar-sa', 'da-dk', 'fi-fi', 'ja-jp', 'nb-no',
    'nl-be', 'nl-nl', 'zh-cn'
  ];
  for (const language of localLanguageList) {
    if (url.includes(language)) {
      return language;
    }
  }
  return 'unknown';
}

function highlightPercent20(url) {
  return url.replace(/%20/g, '<span style="color: red;">%20</span>');
}

async function checkLinks(checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails, checkHeading, ariaCheck, imageCheck, checkMeta, checkAka, checkRedirect) {
  const allLinks = [];
  const brokenLinks = [];
  const localLanguageLinks = [];
  const localLanguageList = [
    'en-us', 'en-au', 'en-ca', 'en-gb', 'en-hk', 'en-ie', 'en-in', 'en-my', 'en-nz', 'en-ph', 'en-sg', 'en-za', 'es-es',
    'es-mx', 'fr-be', 'fr-ca', 'fr-fr', 'it-it', 'ko-kr', 'pt-br', 'de-de', 'ar-sa', 'da-dk', 'fi-fi', 'ja-jp', 'nb-no',
    'nl-be', 'nl-nl', 'zh-cn'
  ];
  const headingHierarchy = [];
  const ariaDetails = [];
  const imageDetails = [];
  const metaDetails = [];
  const akaLinks = [];
  const redirectLinks = [];

  // const toggleSelector = document.getElementById('toggleSelector');
  // const primaryAreaSelector = toggleSelector && toggleSelector.checked ? '#primaryArea ' : '';
 

  // const linksSelector = `${primaryAreaSelector}a`;
  // const headingSelector = `${primaryAreaSelector}h1, ${primaryAreaSelector}h2, ${primaryAreaSelector}h3, ${primaryAreaSelector}h4, ${primaryAreaSelector}h5, ${primaryAreaSelector}h6`;
  // const ariaSelector = `${primaryAreaSelector}[aria-label]`;
  // const imageSelector = `${primaryAreaSelector}img`;
  // const metaSelector = `${primaryAreaSelector}meta`;

  const links = Array.from(document.querySelectorAll('#primaryArea a')).map(link => ({
    url: link.href,
    text: link.textContent 
  }));

  for (const link of links) {
    try {
      const response = await fetch(link.url);
      const status = response.status;

      if (checkAllLinks || checkAllDetails) allLinks.push({ url: link.url, status });

      if ((checkBrokenLinks || checkAllDetails) && (status === 400 || status === 404 || status === 410 || status === 502 || status === 408 || status === 503 || link.url.includes('%20'))) {
        brokenLinks.push({ url: link.url, status });
      }

      if((checkRedirect || checkAllDetails) && (status ===301) && (status === 302)){
        redirectLinks.push({url: link.url, status });
      }

      if ((checkLocalLanguageLinks || checkAllDetails) && localLanguageList.some(language => link.url.includes(language))) {
        localLanguageLinks.push(link);
      }

    } catch (error) {
      console.log(error);
    }
  }

  if (checkHeading || checkAllDetails) {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(heading => ({
      tag: heading.tagName.toLowerCase(),
      text: heading.textContent.trim()
    }));
    headingHierarchy.push(...headings);
  }

  if (ariaCheck || checkAllDetails) {
    const ariaElements = Array.from(document.querySelectorAll('[aria-label]')).map(element => ({
      element: element.tagName.toLowerCase(),
      ariaLabel: element.getAttribute('aria-label'),
      target: element.getAttribute('href') ||'',
      link: element.href || element.closest('a')?.href || ''
    }));
    ariaDetails.push(...ariaElements);
  }

  if (imageCheck || checkAllDetails) {
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt || 'No alt text'
    }));
    imageDetails.push(...images);
  }


  if (checkMeta || checkAllDetails) {
    const metaTags = Array.from(document.querySelectorAll('meta')).map(metaTag => ({
        tagName: metaTag.getAttribute('name') || metaTag.getAttribute('property') || metaTag.getAttribute('http-equiv'),
        content: metaTag.getAttribute('content')
    })).filter(meta => meta.tagName && meta.content); // Filter to only include meta tags with both tagName and content
    metaDetails.push(...metaTags);
}

//Short URL Check
if (checkAka || checkAllDetails) {
  const filteredLinks = Array.from(document.querySelectorAll('a'))
    .filter(link => link.href.includes('aka.ms') || !link.href.includes('microsoft.com') && !link.href.includes('www.')&& !link.href.includes('com'))
    .map(link => ({
      url: link.href,
      status: link.href.includes('aka.ms') || !link.href.includes('microsoft.com') && !link.href.includes('www.') && !link.href.includes('com') ? 'Included' : 'Excluded'
    }));

  akaLinks.push(...filteredLinks);
}

  return { allLinks, brokenLinks, localLanguageLinks, headingHierarchy, ariaDetails, imageDetails, metaDetails, akaLinks, redirectLinks};
  }

/////////////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function() {
  const nightModeButton = document.getElementById('nightModeButton');
  const body = document.body;

  nightModeButton.addEventListener('click', function() {
    // Toggle night mode class on body
    body.classList.toggle('night-mode');
    // Change button text and symbol based on night mode state
    if (body.classList.contains('night-mode')) {
      nightModeButton.innerHTML = '<i class="fas fa-sun"></i> ';
    } else {
      nightModeButton.innerHTML = '<i class="fa-solid fa-moon"></i> ';
    }
  });
});
  //////////////////////////////////////////Checkbox///////////////////////////////////////
  document.addEventListener("DOMContentLoaded", function() {
    var checkAllDetails = document.getElementById("checkAllDetails");
    var checkboxes = document.querySelectorAll('input[type="checkbox"]:not(#toggleSelector)');
    
    // Function to toggle other checkboxes based on Check all details checkbox
    function toggleCheckboxes() {
        checkboxes.forEach(function(checkbox) {
            if (checkbox !== checkAllDetails) {
                checkbox.checked = checkAllDetails.checked;
            }
        });
    }
    
    // Event listener for Check all details checkbox
    checkAllDetails.addEventListener("change", toggleCheckboxes);
  });
  ////////////////////////////////////////////////////////////////////////////////////
