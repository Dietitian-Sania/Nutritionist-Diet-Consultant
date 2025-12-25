// Enhanced Visitor Tracker - Sends notification on website visit with user details
(function() {
    // Don't track if already tracked in this session
    if (sessionStorage.getItem('website_visit_tracked')) {
        return;
    }
    
    // Set flag to avoid duplicate notifications in same session
    sessionStorage.setItem('website_visit_tracked', 'true');
    
    // Collect visitor information
    const timestamp = new Date().toLocaleString();
    const pageUrl = window.location.href;
    const referrer = document.referrer || 'Direct Visit';
    const userAgent = navigator.userAgent;
    const screenRes = `${screen.width}x${screen.height}`;
    const language = navigator.language;
    
    // Try to get user name and email from potential sources
    let userName = 'Not Provided';
    let userEmail = 'Not Provided';
    
    // Check if there's a form with name/email fields already filled
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const nameInputs = form.querySelectorAll('input[type="text"][id*="name"], input[type="text"][name*="name"]');
        const emailInputs = form.querySelectorAll('input[type="email"], input[name*="email"]');
        
        if (nameInputs.length > 0 && nameInputs[0].value) {
            userName = nameInputs[0].value;
        }
        
        if (emailInputs.length > 0 && emailInputs[0].value) {
            userEmail = emailInputs[0].value;
        }
    });
    
    // Also check localStorage for previously saved user info
    const savedUserInfo = localStorage.getItem('dr_sania_user_info');
    if (savedUserInfo) {
        try {
            const userInfo = JSON.parse(savedUserInfo);
            if (userInfo.name && userName === 'Not Provided') {
                userName = userInfo.name;
            }
            if (userInfo.email && userEmail === 'Not Provided') {
                userEmail = userInfo.email;
            }
        } catch (e) {
            console.log('No saved user info found');
        }
    }
    
    // Prepare notification data
    const notificationData = {
        _subject: `👤 Website Visitor: ${userName === 'Not Provided' ? 'New Visitor' : userName}`,
        _template: 'table',
        _cc: 'dietitiansania35@gmail.com', // CC to Dr. Sania's email
        Visitor_Type: userName === 'Not Provided' ? 'New Anonymous Visitor' : 'Returning Visitor',
        Timestamp: timestamp,
        Page_Visited: pageUrl,
        Referrer: referrer,
        Browser_Info: userAgent,
        Screen_Resolution: screenRes,
        Language: language,
        IP_Address: 'Fetching...', // Note: IP needs server-side code
        Visit_Duration: 'Just Arrived',
        Action_Needed: userName === 'Not Provided' ? 'Engage for details' : 'Follow up with lead'
    };
    
    // Send notification immediately on page load
    sendVisitorNotification(notificationData);
    
    // Also save user info from form submissions for future visits
    document.addEventListener('DOMContentLoaded', function() {
        setupFormTracking();
    });
    
    // Function to send notification
    function sendVisitorNotification(data) {
        // Using FormSubmit.co with your existing endpoint
        fetch('https://formsubmit.co/ajax/asadullahjvd1125@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(responseData => {
            console.log('✅ Visitor notification sent to Dr. Sania');
            console.log('Visitor Details:', {
                name: data.Name,
                email: data.Email,
                time: data.Timestamp
            });
            
            // Save successful notification
            localStorage.setItem('last_notification_time', new Date().toISOString());
        })
        .catch(error => {
            console.error('❌ Notification failed:', error);
            
            // Fallback: Try direct email
            sendFallbackEmail(data);
        });
    }
    
    // Fallback email method
    function sendFallbackEmail(data) {
        const mailtoLink = `mailto:dietitiansania35@gmail.com?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(
            `Visitor Notification:
            
Name: ${data.Name}
Email: ${data.Email}
Time: ${data.Timestamp}
Page: ${data.Page_Visited}
Referrer: ${data.Referrer}
Browser: ${data.Browser_Info}
Screen: ${data.Screen_Resolution}
Language: ${data.Language}
            
This is an automated notification from Dr. Sania's website.`
        )}`;
        
        // Create hidden link to trigger email client
        const mailLink = document.createElement('a');
        mailLink.href = mailtoLink;
        mailLink.style.display = 'none';
        document.body.appendChild(mailLink);
        
        setTimeout(() => {
            // mailLink.click(); // Uncomment if you want to try fallback
            document.body.removeChild(mailLink);
        }, 100);
    }
    
    // Setup form tracking to capture user details
    function setupFormTracking() {
        const appointmentForm = document.getElementById('appointment-form');
        
        if (appointmentForm) {
            // Monitor form inputs for name and email
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            
            if (nameInput && emailInput) {
                // Save user info when they type (with debouncing)
                let nameTimeout, emailTimeout;
                
                nameInput.addEventListener('input', function() {
                    clearTimeout(nameTimeout);
                    nameTimeout = setTimeout(() => {
                        if (this.value.trim()) {
                            saveUserInfo('name', this.value);
                        }
                    }, 1000);
                });
                
                emailInput.addEventListener('input', function() {
                    clearTimeout(emailTimeout);
                    emailTimeout = setTimeout(() => {
                        if (this.value.trim()) {
                            saveUserInfo('email', this.value);
                        }
                    }, 1000);
                });
                
                // Also track form submission
                const whatsappBtn = document.getElementById('whatsapp-btn');
                if (whatsappBtn) {
                    whatsappBtn.addEventListener('click', function() {
                        const name = nameInput.value.trim();
                        const email = emailInput.value.trim();
                        
                        if (name && email) {
                            // Save user info
                            saveUserInfo('name', name);
                            saveUserInfo('email', email);
                            
                            // Send enhanced notification with confirmed details
                            sendEnhancedNotification(name, email);
                        }
                    });
                }
            }
        }
    }
    
    // Save user info to localStorage
    function saveUserInfo(type, value) {
        let userInfo = {};
        const saved = localStorage.getItem('dr_sania_user_info');
        
        if (saved) {
            try {
                userInfo = JSON.parse(saved);
            } catch (e) {
                userInfo = {};
            }
        }
        
        userInfo[type] = value;
        userInfo.lastUpdated = new Date().toISOString();
        
        localStorage.setItem('dr_sania_user_info', JSON.stringify(userInfo));
        console.log(`User ${type} saved:`, value);
    }
    
    // Send enhanced notification when user provides details
    function sendEnhancedNotification(name, email) {
        // Don't send duplicate enhanced notifications too frequently
        const lastEnhanced = localStorage.getItem('last_enhanced_notification');
        if (lastEnhanced) {
            const lastTime = new Date(lastEnhanced);
            const now = new Date();
            const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return; // Don't send more than once per day
            }
        }
        
        const enhancedData = {
            _subject: `🎯 LEAD CAPTURED: ${name} visited website`,
            _template: 'table',
            _cc: 'dietitiansania35@gmail.com',
            Status: 'HOT LEAD - Details Captured',
            Name: name,
            Email: email,
            Phone: document.getElementById('phone') ? document.getElementById('phone').value || 'Not provided' : 'Not provided',
            Service: document.getElementById('service') ? document.getElementById('service').value || 'Not selected' : 'Not selected',
            Timestamp: new Date().toLocaleString(),
            Page: window.location.href,
            Action_Required: 'CONTACT IMMEDIATELY - User showed interest',
            Priority: 'HIGH'
        };
        
        fetch('https://formsubmit.co/ajax/asadullahjvd1125@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(enhancedData)
        })
        .then(response => response.json())
        .then(() => {
            console.log('✅ Enhanced lead notification sent');
            localStorage.setItem('last_enhanced_notification', new Date().toISOString());
        })
        .catch(error => {
            console.error('Enhanced notification failed:', error);
        });
    }
    
    // Optional: Track page engagement
    let timeOnPage = 0;
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        if (timeOnPage > 30) { // Only send if spent more than 30 seconds
            const engagementData = {
                _subject: `⏱️ Visitor Engagement: ${timeOnPage}s on site`,
                _template: 'box',
                Name: userName,
                Email: userEmail,
                Time_On_Page: `${timeOnPage} seconds`,
                Pages_Visited: 'Homepage + possibly others',
                Exit_Time: new Date().toLocaleString()
            };
            
            // Send quick engagement notification
            fetch('https://formsubmit.co/ajax/asadullahjvd1125@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(engagementData)
            })
            .then(response => response.json())
            .then(() => {
                console.log('Engagement tracked:', timeOnPage, 'seconds');
            })
            .catch(() => {
                // Silent fail for engagement tracking
            });
        }
    });
})();