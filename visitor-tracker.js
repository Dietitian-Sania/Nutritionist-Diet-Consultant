// Enhanced Visitor Tracker - Sends notification on website visit with user details
(function() {
    // Don't track if already tracked in this session
    if (sessionStorage.getItem('website_visit_tracked')) {
        return;
    }
    
    // Set flag to avoid duplicate notifications in same session
    sessionStorage.setItem('website_visit_tracked', 'true');
    
    // Function to get user's location from IP
    async function getUserLocation() {
        try {
            // First try IP-API (free, no API key needed)
            const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,zip,lat,lon,isp,query');
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'success') {
                    return {
                        city: data.city || 'Unknown',
                        region: data.regionName || 'Unknown',
                        country: data.country || 'Unknown',
                        zip: data.zip || 'Unknown',
                        isp: data.isp || 'Unknown',
                        ip: data.query || 'Unknown',
                        coordinates: data.lat && data.lon ? `${data.lat}, ${data.lon}` : 'Unknown'
                    };
                }
            }
        } catch (error) {
            console.log('IP-API failed, trying fallback...');
        }
        
        // Fallback: Try ipinfo.io
        try {
            const response = await fetch('https://ipinfo.io/json');
            
            if (response.ok) {
                const data = await response.json();
                return {
                    city: data.city || 'Unknown',
                    region: data.region || 'Unknown',
                    country: data.country || 'Unknown',
                    zip: data.postal || 'Unknown',
                    isp: data.org || 'Unknown',
                    ip: data.ip || 'Unknown',
                    coordinates: data.loc || 'Unknown'
                };
            }
        } catch (error) {
            console.log('ipinfo.io failed');
        }
        
        // Return default
        return {
            city: 'Could not detect',
            region: 'Could not detect',
            country: 'Could not detect',
            zip: 'N/A',
            isp: 'Unknown',
            ip: 'Unknown',
            coordinates: 'Unknown'
        };
    }
    
    // SIMPLIFIED & EFFECTIVE name detection that actually works
    function detectUserName() {
        let detectedName = null;
        
        console.log('Starting name detection...');
        
        // 1. FIRST CHECK: Check OUR OWN localStorage for previously saved name
        // This is the MOST RELIABLE method for returning visitors
        try {
            const savedUserInfo = localStorage.getItem('dr_sania_user_info');
            if (savedUserInfo) {
                const userInfo = JSON.parse(savedUserInfo);
                if (userInfo.name && userInfo.name.trim() && userInfo.name !== 'Not Provided') {
                    console.log('✅ Found name in localStorage:', userInfo.name);
                    return userInfo.name.trim();
                }
            }
        } catch (e) {
            console.log('No name in localStorage');
        }
        
        // 2. Check if name is already filled in any form on the page
        // This works for users who partially filled forms
        const nameInputs = document.querySelectorAll('input[type="text"][name*="name"], input[type="text"][id*="name"], input[name*="fullname"], input[name*="fname"]');
        
        for (let input of nameInputs) {
            if (input.value && input.value.trim()) {
                console.log('✅ Found name in form input:', input.value);
                return input.value.trim();
            }
        }
        
        // 3. Check URL parameters (if user came from a link with their name)
        const urlParams = new URLSearchParams(window.location.search);
        const nameFromUrl = urlParams.get('name') || urlParams.get('fullname') || urlParams.get('fname');
        if (nameFromUrl && nameFromUrl.trim()) {
            console.log('✅ Found name in URL:', nameFromUrl);
            return nameFromUrl.trim();
        }
        
        // 4. Check if there's a welcome message or greeting containing name
        // This is useful if your site displays user name after login
        const bodyText = document.body.innerText;
        const namePatterns = [
            'Welcome,', 'Hello,', 'Hi,', 'Hey,',
            'Welcome back,', 'Good to see you,'
        ];
        
        for (let pattern of namePatterns) {
            const index = bodyText.indexOf(pattern);
            if (index !== -1) {
                const afterPattern = bodyText.substring(index + pattern.length, index + pattern.length + 50);
                const possibleName = afterPattern.split('\n')[0].split('.')[0].split('!')[0].split('?')[0].trim();
                if (possibleName && possibleName.length > 1 && possibleName.length < 30) {
                    console.log('✅ Found name in greeting:', possibleName);
                    return possibleName;
                }
            }
        }
        
        // 5. Check meta tags (sometimes used for logged-in users)
        const metaName = document.querySelector('meta[name="user-name"], meta[property="user:name"]');
        if (metaName && metaName.content) {
            console.log('✅ Found name in meta tag:', metaName.content);
            return metaName.content.trim();
        }
        
        // 6. Check for any element with class containing "user-name", "profile-name", etc.
        const nameElements = document.querySelectorAll('[class*="user-name"], [class*="profile-name"], [class*="user_name"], [id*="user-name"], [id*="profile-name"]');
        for (let el of nameElements) {
            if (el.innerText && el.innerText.trim() && el.innerText.length < 50) {
                console.log('✅ Found name in element class/id:', el.innerText);
                return el.innerText.trim();
            }
        }
        
        console.log('❌ Could not detect name automatically');
        return null;
    }
    
    // Extract name from email if we have email
    function extractNameFromEmail(email) {
        if (!email || typeof email !== 'string') return null;
        
        const emailLower = email.toLowerCase();
        
        // Skip common email providers' default addresses
        const skipPatterns = [
            'info@', 'contact@', 'support@', 'admin@', 
            'hello@', 'noreply@', 'no-reply@', 'newsletter@'
        ];
        
        for (let pattern of skipPatterns) {
            if (emailLower.startsWith(pattern)) {
                return null;
            }
        }
        
        // Extract username part (before @)
        const username = email.split('@')[0];
        
        // Remove numbers and special characters
        const cleanUsername = username.replace(/[0-9._-]/g, ' ');
        
        // Split by spaces or dots and capitalize
        const nameParts = cleanUsername.split(/[\s.]+/).filter(part => part.length > 1);
        
        if (nameParts.length === 0) return null;
        
        // Capitalize each part
        const formattedName = nameParts.map(part => 
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
        
        return formattedName.length > 1 ? formattedName : null;
    }
    
    // Main tracking function
    async function trackVisitor() {
        // Collect visitor information
        const timestamp = new Date().toLocaleString();
        const pageUrl = window.location.href;
        const referrer = document.referrer || 'Direct Visit';
        const userAgent = navigator.userAgent;
        const screenRes = `${screen.width}x${screen.height}`;
        const language = navigator.language;
        
        // Get user location
        const locationData = await getUserLocation();
        
        // Try to detect user name (SYNCHRONOUS - this actually works)
        let userName = detectUserName();
        let userEmail = null;
        
        // Try to get email from forms
        const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"]');
        for (let input of emailInputs) {
            if (input.value && input.value.includes('@')) {
                userEmail = input.value.trim();
                console.log('Found email in form:', userEmail);
                break;
            }
        }
        
        // Check localStorage for saved email
        if (!userEmail) {
            try {
                const savedUserInfo = localStorage.getItem('dr_sania_user_info');
                if (savedUserInfo) {
                    const userInfo = JSON.parse(savedUserInfo);
                    if (userInfo.email && userInfo.email.includes('@')) {
                        userEmail = userInfo.email.trim();
                        console.log('Found email in localStorage:', userEmail);
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        // If we have email but no name, try to extract name from email
        if (userEmail && !userName) {
            const extractedName = extractNameFromEmail(userEmail);
            if (extractedName) {
                userName = extractedName + ' (from email)';
                console.log('Extracted name from email:', extractedName);
            }
        }
        
        // Prepare location string
        let locationStr = 'Unknown';
        if (locationData.city !== 'Could not detect') {
            locationStr = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
        }
        
        // Determine visitor type
        let visitorType = 'New Anonymous Visitor';
        let subjectPrefix = '👤';
        
        if (userName) {
            visitorType = 'Returning Visitor';
            subjectPrefix = '👤 Returning:';
        } else if (userEmail) {
            visitorType = 'Visitor with Email';
            subjectPrefix = '📧 Email Provided:';
        }
        
        // If location is specific, add emoji
        if (locationData.city !== 'Could not detect') {
            subjectPrefix = '📍 ' + subjectPrefix;
        }
        
        // Create subject
        const subject = userName 
            ? `${subjectPrefix} ${userName.replace(' (from email)', '')}`
            : `${subjectPrefix} New Visitor from ${locationData.city !== 'Could not detect' ? locationData.city : 'Unknown Location'}`;
        
        // Prepare notification data
        const notificationData = {
            _subject: subject,
            _template: 'table',
            _cc: 'dietitiansania35@gmail.com',
            Visitor_Type: visitorType,
            Timestamp: timestamp,
            Page_Visited: pageUrl,
            Referrer: referrer,
            Browser_Info: userAgent,
            Location: locationStr,
            ZIP_Code: locationData.zip,
        };
        
        // Add name if we have it
        if (userName) {
            notificationData.Name = userName.replace(' (from email)', '');
            if (userName.includes('(from email)')) {
                notificationData.Name_Source = 'Extracted from email';
            }
        }
        
        // Add email if we have it
        if (userEmail) {
            notificationData.Email = userEmail;
        }
        
        console.log('Sending notification with:', {
            name: userName,
            email: userEmail,
            location: locationStr
        });
        
        // Send notification
        sendVisitorNotification(notificationData);
        
        // Save location data for future reference
        if (locationData.city !== 'Could not detect') {
            localStorage.setItem('user_location', JSON.stringify(locationData));
        }
        
        // Save user info if we found any
        if (userName || userEmail) {
            saveUserInfo(userName, userEmail);
        }
        
        // Setup form tracking for future interactions
        setupFormTracking();
    }
    
    // Function to send notification
    function sendVisitorNotification(data) {
        // Clean up data
        const cleanData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                cleanData[key] = data[key];
            }
        });
        
        // Using FormSubmit.co
        fetch('https://formsubmit.co/ajax/asadullahjvd1125@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(cleanData)
        })
        .then(response => response.json())
        .then(responseData => {
            console.log('✅ Visitor notification sent successfully');
            localStorage.setItem('last_notification_time', new Date().toISOString());
        })
        .catch(error => {
            console.error('❌ Notification failed:', error);
        });
    }
    
    // Save user info to localStorage
    function saveUserInfo(name, email) {
        let userInfo = {};
        try {
            const saved = localStorage.getItem('dr_sania_user_info');
            if (saved) {
                userInfo = JSON.parse(saved);
            }
        } catch (e) {
            userInfo = {};
        }
        
        if (name && name !== 'Not Provided' && !name.includes('(from email)')) {
            userInfo.name = name.replace(' (from email)', '');
        }
        
        if (email && email !== 'Not Provided') {
            userInfo.email = email;
        }
        
        userInfo.lastUpdated = new Date().toISOString();
        userInfo.firstDetected = userInfo.firstDetected || new Date().toISOString();
        
        localStorage.setItem('dr_sania_user_info', JSON.stringify(userInfo));
        console.log('Saved user info:', userInfo);
    }
    
    // Setup form tracking
    function setupFormTracking() {
        // Track form interactions
        document.addEventListener('input', function(e) {
            if (e.target.matches('input[name*="name"], input[id*="name"]')) {
                if (e.target.value && e.target.value.trim()) {
                    saveUserInfo(e.target.value.trim(), null);
                }
            }
            
            if (e.target.matches('input[type="email"], input[name*="email"]')) {
                if (e.target.value && e.target.value.includes('@')) {
                    saveUserInfo(null, e.target.value.trim());
                }
            }
        }, true);
        
        // Track form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const nameInput = form.querySelector('input[name*="name"], input[id*="name"]');
            const emailInput = form.querySelector('input[type="email"], input[name*="email"]');
            
            let name = null;
            let email = null;
            
            if (nameInput && nameInput.value) {
                name = nameInput.value.trim();
            }
            
            if (emailInput && emailInput.value) {
                email = emailInput.value.trim();
            }
            
            if (name || email) {
                saveUserInfo(name, email);
                
                // Send enhanced notification
                if (name && email) {
                    setTimeout(() => sendEnhancedNotification(name, email), 1000);
                }
            }
        });
    }
    
    // Send enhanced notification
    async function sendEnhancedNotification(name, email) {
        // Get location
        let locationData = {};
        const savedLocation = localStorage.getItem('user_location');
        
        if (savedLocation) {
            try {
                locationData = JSON.parse(savedLocation);
            } catch (e) {
                locationData = await getUserLocation();
            }
        } else {
            locationData = await getUserLocation();
        }
        
        const locationStr = locationData.city !== 'Could not detect' ? 
            `${locationData.city}, ${locationData.region}` : 'Unknown Location';
        
        const enhancedData = {
            _subject: `🎯 FORM SUBMITTED: ${name} from ${locationData.city || 'Unknown'}`,
            _template: 'table',
            _cc: 'dietitiansania35@gmail.com',
            Status: 'HOT LEAD - Form Submitted',
            Name: name,
            Email: email,
            Location: locationStr,
            Timestamp: new Date().toLocaleString(),
            Action_Required: 'CONTACT WITHIN 24 HOURS',
            Priority: 'HIGH',
            Note: `Lead completed contact form. Respond promptly!`
        };
        
        fetch('https://formsubmit.co/ajax/asadullahjvd1125@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(enhancedData)
        })
        .then(() => {
            console.log('✅ Enhanced notification sent');
        })
        .catch(error => {
            console.error('Enhanced notification failed:', error);
        });
    }
    
    // Track time on page
    let timeOnPage = 0;
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        if (timeOnPage > 30) {
            // Get user info for engagement tracking
            let userName = 'Anonymous';
            try {
                const saved = localStorage.getItem('dr_sania_user_info');
                if (saved) {
                    const userInfo = JSON.parse(saved);
                    userName = userInfo.name || 'Anonymous';
                }
            } catch (e) {
                // Use default
            }
            
            console.log(`User spent ${timeOnPage} seconds on site`);
        }
    });
    
    // Start tracking
    trackVisitor();
})();
