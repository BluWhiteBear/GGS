// This is a development only script that converts the previous blogpost format to JSON

function extractBlogPost(blogPostElement) {
    // Extract header info
    const type = blogPostElement.querySelector('.font-weight-light').textContent.split('|')[1].trim();
    const version = blogPostElement.querySelector('b').textContent.replace('Version ', '');
    const date = blogPostElement.querySelector('p').textContent.split('-')[1].trim();
    const title = blogPostElement.querySelector('.col-lg-8 .font-weight-light').textContent;
    
    // Extract dev notes
    const devNotesP = blogPostElement.querySelector('.col-lg-8 p');
    const devNotes = devNotesP.textContent.split('-')[0].trim();
    const author = devNotesP.textContent.split('-')[1].trim();

    // Extract sections
    const sections = [];
    const allSections = blogPostElement.querySelectorAll('.collapse h5');
    
    allSections.forEach(sectionHeader => {
        const sectionTitle = sectionHeader.textContent.replace(':', '');
        const dlElement = sectionHeader.nextElementSibling;
        const changes = [];
        
        const terms = dlElement.querySelectorAll('dt');
        const descriptions = dlElement.querySelectorAll('dd');
        
        for (let i = 0; i < terms.length; i++) {
            changes.push({
                name: terms[i].textContent,
                description: descriptions[i]?.textContent || ''
            });
        }
        
        sections.push({
            title: sectionTitle,
            changes: changes
        });
    });

    // Extract media and download URLs
    const mediaUrl = blogPostElement.querySelector('img[src*="Screenshots"]')?.getAttribute('src') || '';
    const downloadUrl = blogPostElement.querySelector('a[href*="meta.com"]')?.getAttribute('href') || '';

    return {
        type,
        version,
        date,
        title,
        author,
        devNotes,
        sections,
        mediaUrl,
        downloadUrl
    };
}

function convertExistingPosts() {
    const blogPosts = document.querySelectorAll('.card.text-white.bg-dark:not([hidden])');
    const jsonData = {
        posts: Array.from(blogPosts).map(post => extractBlogPost(post))
    };
    
    console.log(JSON.stringify(jsonData, null, 4));
}