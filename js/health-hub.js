// Health Hub functionality with local content

// Local content database
const healthContent = {
    encouragement: [
      "Every step you take brings you closer to your recovery goals. Keep going!",
      "Progress isn't always visible day-to-day, but your consistency is building strength for tomorrow.",
      "Your commitment to rehabilitation today is creating a healthier future. Be proud of your efforts!",
      "Remember that healing takes time, but your dedication makes all the difference.",
      "Small victories add up to big progress. Celebrate each achievement in your rehabilitation journey.",
      "The strength you're building now will serve you for years to come. Stay with it!",
      "Your resilience through this process is inspiring. Keep pushing forward with confidence."
    ],
    tips: [
      {
        title: "Stay Hydrated",
        description: "Drink at least 8 glasses of water daily to support muscle recovery and joint health."
      },
      {
        title: "Prioritize Sleep",
        description: "Aim for 7-9 hours of quality sleep each night as this is when your body does most of its healing."
      },
      {
        title: "Mindful Movement",
        description: "Pay attention to how exercises feel - discomfort is normal, but sharp pain means stop."
      },
      {
        title: "Balanced Nutrition",
        description: "Include protein for muscle repair, anti-inflammatory foods, and plenty of vegetables."
      },
      {
        title: "Set Small Goals",
        description: "Break your rehabilitation into manageable milestones to maintain motivation and track progress."
      },
      {
        title: "Deep Breathing",
        description: "Practice deep breathing exercises daily to reduce tension and improve oxygen flow to healing tissues."
      }
    ],
    education: [
      {
        id: "debunking-pt-misconceptions",
        title: "Debunking Physical Therapy Misconceptions",
        summary: "Learn the truth behind common myths about physical therapy and rehabilitation.",
        link: "https://www.touchstonerehabilitation.com/blog/debunking-physical-therapy-misconceptions"
      },
      {
        id: "understanding-pain",
        title: "Understanding Pain and its Management",
        summary: "Discover different types of pain and effective strategies for managing it during rehabilitation.",
        link: "https://iconhealthscreening.sg/en/understanding-pain-and-its-management/"
      },
      {
        id: "healing-timeline",
        title: "Healing Timeline After Surgery",
        summary: "Learn what to expect at different stages of recovery following a surgical procedure.",
        link: "https://physioandsole.com.sg/physiotherapy-treatments/post-surgery-physiotherapy/"
      },
      {
        id: "weight-joint-health",
        title: "Impact of Weight on Joint Health",
        summary: "Understand how your weight affects your joints and recovery from a physiotherapist's perspective.",
        link: "https://elevatephysio.com.sg/the-impact-of-weight-on-joint-health-a-physiotherapists-perspective/"
      },
      {
        id: "sleep-techniques",
        title: "Improve Sleep with Physiotherapy Techniques",
        summary: "Discover how proper sleep positions and relaxation exercises can enhance your recovery.",
        link: "https://elevatephysio.com.sg/how-to-improve-your-sleep-with-physiotherapy-techniques/"
      },
      {
        id: "post-surgical-recovery",
        title: "Benefits of Physiotherapy After Surgery",
        summary: "Learn how physiotherapy can accelerate healing and improve outcomes following surgery.",
        link: "https://elevatephysio.com.sg/the-benefits-of-physiotherapy-for-post-surgical-recovery/"
      }
    ],
    faqs: [
      {
        question: "How often should I do my exercises?",
        answer: "Follow your therapist's specific recommendations. Generally, consistency with daily practice is more beneficial than occasional intense sessions."
      },
      {
        question: "When should I stop if I feel pain?",
        answer: "Stop immediately if you experience sharp, stabbing, or increasing pain. Mild discomfort is normal, but pain that persists or worsens may indicate a problem."
      },
      {
        question: "How long until I see improvement?",
        answer: "Recovery timelines vary greatly depending on your condition, age, overall health, and adherence to your program. Some notice changes within days, while others might take weeks or months."
      },
      {
        question: "Should I apply ice or heat?",
        answer: "Generally, ice is best for acute injuries and inflammation (first 48-72 hours), while heat is better for chronic pain and stiffness. Always follow your healthcare provider's specific recommendations."
      },
      {
        question: "Can I modify exercises if they're too difficult?",
        answer: "Yes, but consult with your healthcare provider about appropriate modifications. The goal is to maintain the therapeutic benefit while accommodating your current abilities."
      },
      {
        question: "Is it normal to feel tired after therapy?",
        answer: "Yes, fatigue is common after rehabilitation exercises, especially early in recovery. Your body is working hard to heal and adapt. Make sure to rest adequately between sessions."
      }
    ]
  };
  
  // Function to get random content from a category
  function getRandomContent(category) {
    const content = healthContent[category];
    if (!content || !content.length) return null;
    
    const randomIndex = Math.floor(Math.random() * content.length);
    return content[randomIndex];
  }
  
  // Initialize health hub features
  document.addEventListener('DOMContentLoaded', function() {
    initHealthHub();
    loadPersonalizedContent();
  });
  
  // Initialize the health hub tabs and interactivity
  function initHealthHub() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.hub-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all sections
        const sections = document.querySelectorAll('.hub-section');
        sections.forEach(s => s.classList.remove('active'));
        
        // Show corresponding section
        const tabName = this.getAttribute('data-tab');
        document.getElementById(tabName + '-section').classList.add('active');
      });
    });
    
    // Refresh button functionality
    const refreshButton = document.getElementById('refreshHub');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
        const activeTab = document.querySelector('.hub-tab.active').getAttribute('data-tab');
        if (activeTab === 'encouragement') {
          fetchEncouragement();
        } else if (activeTab === 'tips') {
          fetchHealthTips();
        } else if (activeTab === 'education') {
          fetchEducationContent();
        } else if (activeTab === 'faq') {
          fetchFAQContent();
        }
      });
    }
    
    // Setup FAQ toggle functionality
    setupFAQToggle();
  }
  
  // Setup FAQ toggle functionality
  function setupFAQToggle() {
    // Initial setup for any existing FAQ questions
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
      question.addEventListener('click', function() {
        toggleFAQ(this);
      });
    });
  }
  
  // Load all personalized content
  function loadPersonalizedContent() {
    fetchEncouragement();
    fetchHealthTips();
    fetchEducationContent();
    fetchFAQContent();
  }
  
  // Toggle FAQ answers
  function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const toggleIcon = element.querySelector('.toggle-icon');
    
    if (answer.classList.contains('show')) {
      answer.classList.remove('show');
      toggleIcon.textContent = '+';
    } else {
      answer.classList.add('show');
      toggleIcon.textContent = '−';
    }
  }
  
  // Fetch personalized encouragement
  function fetchEncouragement() {
    const encouragementElement = document.getElementById('encouragement-message');
    if (!encouragementElement) return;
    
    const message = getRandomContent('encouragement');
    encouragementElement.textContent = message;
  }
  
  // Fetch health tips
  function fetchHealthTips() {
    const tipsSection = document.getElementById('tips-section');
    if (!tipsSection) return;
    
    // Clear existing tips
    tipsSection.innerHTML = '';
    
    // Randomly select 3 health tips without duplication
    const tipIndices = [];
    const allTips = healthContent.tips;
    
    // Get 3 random indices (or fewer if not enough tips available)
    while (tipIndices.length < 3 && tipIndices.length < allTips.length) {
      const randomIndex = Math.floor(Math.random() * allTips.length);
      if (!tipIndices.includes(randomIndex)) {
        tipIndices.push(randomIndex);
      }
    }
    
    // Add selected tips to the section
    tipIndices.forEach(index => {
      const tip = allTips[index];
      const tipCard = document.createElement('div');
      tipCard.className = 'tip-card';
      tipCard.innerHTML = `
        <h4>${tip.title}</h4>
        <p>${tip.description}</p>
      `;
      tipsSection.appendChild(tipCard);
    });
  }
  
  // Fetch educational content
  function fetchEducationContent() {
    const educationSection = document.getElementById('education-section');
    if (!educationSection) return;
    
    // Clear existing content
    educationSection.innerHTML = '';
    
    // Randomly select 3 education topics without duplication
    const topicIndices = [];
    const allTopics = healthContent.education;
    
    // Get 3 random indices (or fewer if not enough topics available)
    while (topicIndices.length < 3 && topicIndices.length < allTopics.length) {
      const randomIndex = Math.floor(Math.random() * allTopics.length);
      if (!topicIndices.includes(randomIndex)) {
        topicIndices.push(randomIndex);
      }
    }
    
    // Add selected education topics to the section
    topicIndices.forEach(index => {
      const topic = allTopics[index];
      const educationCard = document.createElement('div');
      educationCard.className = 'education-card';
      educationCard.innerHTML = `
        <h4>${topic.title}</h4>
        <p>${topic.summary}</p>
        <a href="${topic.link}" class="read-more" target="_blank">Read More</a>
      `;
      educationSection.appendChild(educationCard);
    });
  }
  
  // Fetch FAQ content
  function fetchFAQContent() {
    const faqSection = document.getElementById('faq-section');
    if (!faqSection) return;
    
    // Clear existing FAQs
    faqSection.innerHTML = '';
    
    // Randomly select 4 FAQs without duplication
    const faqIndices = [];
    const allFaqs = healthContent.faqs;
    
    // Get 4 random indices (or fewer if not enough FAQs available)
    while (faqIndices.length < 4 && faqIndices.length < allFaqs.length) {
      const randomIndex = Math.floor(Math.random() * allFaqs.length);
      if (!faqIndices.includes(randomIndex)) {
        faqIndices.push(randomIndex);
      }
    }
    
    // Add selected FAQs to the section
    faqIndices.forEach(index => {
      const faq = allFaqs[index];
      const faqItem = document.createElement('div');
      faqItem.className = 'faq-item';
      faqItem.innerHTML = `
        <div class="faq-question">
          <span>${faq.question}</span>
          <span class="toggle-icon">+</span>
        </div>
        <div class="faq-answer">
          ${faq.answer}
        </div>
      `;
      faqSection.appendChild(faqItem);
    });
    
    // Re-attach click events to new FAQ questions
    setupFAQToggle();
  }