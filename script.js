document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });

    // Toggle between metric and imperial units
    const formulaRadios = document.querySelectorAll('input[name="formula"]');
    formulaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'metric') {
                document.querySelector('.metric-height').style.display = 'block';
                document.querySelector('.metric-weight').style.display = 'block';
                document.querySelector('.imperial-height').style.display = 'none';
                document.querySelector('.imperial-weight').style.display = 'none';
            } else {
                document.querySelector('.metric-height').style.display = 'none';
                document.querySelector('.metric-weight').style.display = 'none';
                document.querySelector('.imperial-height').style.display = 'block';
                document.querySelector('.imperial-weight').style.display = 'block';
            }
        });
    });

    // BMI Calculator Functionality
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultsSection = document.getElementById('results-section');

    calculateBtn.addEventListener('click', calculateBMI);
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCalculator);
    }

    function calculateBMI() {
        // Get selected formula
        const formula = document.querySelector('input[name="formula"]:checked').value;
        
        // Get basic information
        const age = parseInt(document.getElementById('age').value);
        const gender = document.getElementById('gender').value;
        
        let height, weight;
        
        if (formula === 'metric') {
            height = parseFloat(document.getElementById('height-cm').value);
            weight = parseFloat(document.getElementById('weight-kg').value);
        } else {
            const feet = parseFloat(document.getElementById('height-ft').value);
            const inches = parseFloat(document.getElementById('height-in').value);
            height = (feet * 12 + inches) * 2.54; // Convert to cm
            weight = parseFloat(document.getElementById('weight-lbs').value) * 0.453592; // Convert to kg
        }
        
        // Get activity level
        const activityElement = document.querySelector('input[name="activity"]:checked');
        const activity = activityElement ? activityElement.value : null;
        
        // Validate inputs
        if (isNaN(age) {
            showError('Please enter a valid age');
            return;
        }
        
        if (!gender) {
            showError('Please select your gender');
            return;
        }
        
        if (isNaN(height) || height <= 0) {
            showError('Please enter a valid height');
            return;
        }
        
        if (isNaN(weight) || weight <= 0) {
            showError('Please enter a valid weight');
            return;
        }
        
        if (!activity) {
            showError('Please select your activity level');
            return;
        }
        
        // Calculate BMI
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        const roundedBMI = bmi.toFixed(1);
        
        // Determine BMI category
        let category, categoryClass, interpretation;
        
        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'underweight';
            interpretation = 'Your BMI suggests you are underweight. This may indicate insufficient nutrition or other health concerns.';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Normal weight';
            categoryClass = 'normal';
            interpretation = 'Your BMI is in the healthy range. Maintain your balanced diet and active lifestyle.';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight';
            categoryClass = 'overweight';
            interpretation = 'Your BMI suggests you are overweight. Consider lifestyle changes to improve your health.';
        } else {
            category = 'Obese';
            categoryClass = 'obese';
            interpretation = 'Your BMI suggests obesity. It would be beneficial to consult with Dr. Sania for a personalized plan.';
        }
        
        // Calculate healthy weight range
        const minHealthyWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
        const maxHealthyWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);
        const healthyWeightRange = `${minHealthyWeight}kg - ${maxHealthyWeight}kg`;
        
        // Calculate BMR (Basal Metabolic Rate)
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        // Calculate daily calorie needs based on activity level
        let activityFactor;
        switch(activity) {
            case 'sedentary':
                activityFactor = 1.2;
                break;
            case 'lightly_active':
                activityFactor = 1.375;
                break;
            case 'moderately_active':
                activityFactor = 1.55;
                break;
            case 'very_active':
                activityFactor = 1.725;
                break;
            case 'extra_active':
                activityFactor = 1.9;
                break;
            default:
                activityFactor = 1.2;
        }
        
        const calorieNeeds = Math.round(bmr * activityFactor);
        
        // Generate recommendations
        const recommendations = generateRecommendations(bmi, age, gender, activity);
        
        // Display results
        document.getElementById('bmi-result').textContent = roundedBMI;
        document.getElementById('bmi-category').textContent = category;
        document.getElementById('bmi-category').className = `category ${categoryClass}`;
        document.getElementById('healthy-weight').textContent = healthyWeightRange;
        document.getElementById('bmr-result').textContent = Math.round(bmr) + ' calories/day';
        document.getElementById('calorie-needs').textContent = calorieNeeds + ' calories/day';
        document.getElementById('interpretation-text').textContent = interpretation;
        
        const recommendationsList = document.getElementById('recommendations-list');
        recommendationsList.innerHTML = '';
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recommendationsList.appendChild(li);
        });
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    function generateRecommendations(bmi, age, gender, activity) {
        const recommendations = [];
        
        // General recommendations based on BMI
        if (bmi < 18.5) {
            recommendations.push(
                "Increase calorie intake with nutrient-dense foods",
                "Focus on healthy weight gain through balanced meals",
                "Consider strength training to build muscle mass",
                "Eat frequent, smaller meals if appetite is low"
            );
        } else if (bmi >= 18.5 && bmi < 25) {
            recommendations.push(
                "Maintain your current healthy habits",
                "Continue eating a variety of nutrient-rich foods",
                "Stay physically active with a mix of cardio and strength training",
                "Monitor your weight periodically to maintain your healthy range"
            );
        } else if (bmi >= 25 && bmi < 30) {
            recommendations.push(
                "Aim for gradual weight loss of 0.5-1kg per week",
                "Increase physical activity to at least 150 minutes per week",
                "Focus on portion control and mindful eating",
                "Reduce intake of processed foods and sugary beverages"
            );
        } else {
            recommendations.push(
                "Seek professional guidance for weight management",
                "Aim for sustainable lifestyle changes rather than quick fixes",
                "Incorporate both diet and exercise modifications",
                "Address any emotional or behavioral aspects of eating"
            );
        }
        
        // Activity-specific recommendations
        if (activity === 'sedentary' && bmi >= 25) {
            recommendations.push(
                "Start with light physical activity like walking 10-15 minutes daily",
                "Gradually increase your activity level to meet guidelines"
            );
        }
        
        // Age-specific recommendations
        if (age > 50) {
            recommendations.push(
                "Ensure adequate protein intake to preserve muscle mass",
                "Consider calcium and vitamin D for bone health"
            );
        }
        
        // Gender-specific recommendations
        if (gender === 'female') {
            recommendations.push(
                "Ensure adequate iron intake, especially if premenopausal"
            );
        }
        
        return recommendations;
    }
    
    function showError(message) {
        alert(message);
    }
    
    function resetCalculator() {
        document.getElementById('age').value = '';
        document.getElementById('gender').value = '';
        document.getElementById('height-cm').value = '';
        document.getElementById('weight-kg').value = '';
        document.getElementById('height-ft').value = '';
        document.getElementById('height-in').value = '';
        document.getElementById('weight-lbs').value = '';
        
        document.querySelectorAll('input[name="activity"]').forEach(radio => {
            radio.checked = false;
        });
        
        resultsSection.style.display = 'none';
        
        // Scroll back to form
        document.querySelector('.calculator-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Appointment form submission
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const service = document.getElementById('service').value;
            
            if (!name || !service) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Here you would typically send the form data to a server
            // For this example, we'll just show a success message
            alert(`Thank you, ${name}! Your appointment request for ${service} has been received. Dr. Sania's office will contact you shortly.`);
            
            // Reset form
            this.reset();
        });
    }
    
    // Responsive navigation for mobile
    const mobileNavToggle = document.createElement('div');
    mobileNavToggle.className = 'mobile-nav-toggle';
    mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('header .container').appendChild(mobileNavToggle);
    
    const nav = document.querySelector('nav');
    mobileNavToggle.addEventListener('click', function() {
        nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close mobile nav when clicking on a link
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                nav.style.display = 'none';
            }
        });
    });
    
    // Adjust navigation on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            nav.style.display = '';
        }
    });
});