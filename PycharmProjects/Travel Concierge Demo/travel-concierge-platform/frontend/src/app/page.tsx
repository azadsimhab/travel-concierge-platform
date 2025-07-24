'use client'

import { useState } from 'react'

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <div className="logo-icon">✈️</div>
            <div className="logo-text">TravelAI</div>
          </div>
          
          <nav className="nav">
            <a href="#">Discover</a>
            <a href="#">Trips</a>
            <a href="#">Review</a>
            <a href="#">Forums</a>
          </nav>
          
          <div className="header-actions">
            <button className="btn-primary">
              💬 AI Assistant
            </button>
            <span style={{ color: 'white' }}>INR</span>
            <button className="btn-secondary">Sign in</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">
            ✨ AI-Powered Travel Platform
          </div>
          
          <h1 className="hero-title">Where to?</h1>
          
          <p className="hero-subtitle">
            Discover amazing places with AI-powered recommendations. From flights to hotels, we'll help you plan the perfect journey.
          </p>

          {/* Search Categories */}
          <div className="search-categories">
            {[
              { id: 'all', label: 'Search All', icon: '🔍' },
              { id: 'hotels', label: 'Hotels', icon: '🏨' },
              { id: 'things', label: 'Things to Do', icon: '📸' },
              { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
              { id: 'flights', label: 'Flights', icon: '✈️' },
              { id: 'homes', label: 'Holiday Homes', icon: '🏠' },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Places to go, things to do, hotels..."
                className="search-input"
              />
              <button className="search-btn">Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { icon: '🌍', title: '1000+', subtitle: 'Destinations Worldwide' },
              { icon: '🛡️', title: '99.9%', subtitle: 'Customer Satisfaction' },
              { icon: '⚡', title: '<2s', subtitle: 'AI Response Time' },
            ].map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.title}</div>
                <div className="stat-label">{stat.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="features-grid">
            <div className="features-content">
              <div className="hero-badge">🤖 AI-Powered Recommendations</div>
              <h2 className="section-title" style={{ color: 'white', textAlign: 'left' }}>
                Find things to do for everything you're into
              </h2>
              <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '32px' }}>
                Browse 400,000+ experiences and book with us. Get personalized recommendations from our AI travel assistant.
              </p>
              
              <div>
                {[
                  'AI-powered personalized recommendations',
                  'Real-time local insights and updates',
                  'Instant booking and trip planning'
                ].map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon">⭐</div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button className="btn-primary">Start Planning →</button>
            </div>

            <div className="features-visual">
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>🌍</div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                Discover Amazing Places
              </h3>
              <p style={{ opacity: 0.8 }}>AI-curated travel experiences</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Popular Destinations</h2>
          <p className="section-subtitle">
            Discover the most loved destinations by travelers worldwide
          </p>
          
          <div className="cards-grid">
            {[
              { name: 'Goa', emoji: '🏖️', rating: 4.5, reviews: '12,456', description: 'Beautiful beaches and vibrant nightlife' },
              { name: 'Hyderabad', emoji: '🏛️', rating: 4.3, reviews: '8,234', description: 'Historic city with amazing biryani' },
              { name: 'Kerala', emoji: '🌴', rating: 4.6, reviews: '15,678', description: 'Backwaters and lush hill stations' },
              { name: 'Rajasthan', emoji: '🏰', rating: 4.4, reviews: '11,543', description: 'Royal palaces and golden desert' },
            ].map((destination, index) => (
              <div key={index} className="card">
                <div className="card-image">
                  <span style={{ fontSize: '60px' }}>{destination.emoji}</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{destination.name}</h3>
                  <div className="card-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="star">
                          {i < Math.floor(destination.rating) ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {destination.rating} ({destination.reviews} reviews)
                    </span>
                  </div>
                  <p className="card-description">{destination.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>
            Ready to explore the world?
          </h2>
          <p style={{ fontSize: '20px', opacity: 0.8, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
            Join millions of travelers who trust our AI-powered platform for their perfect journey
          </p>
          <div className="cta-actions">
            <button className="btn-primary">Talk to AI Assistant</button>
            <button className="btn-secondary">Browse Destinations</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <div className="logo">
                <div className="logo-icon">✈️</div>
                <div className="logo-text">TravelAI</div>
              </div>
              <p>AI-powered travel planning made simple and beautiful</p>
            </div>
            
            <div className="footer-section">
              <h4>Company</h4>
              <a href="#">About us</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#">Blog</a>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
            
            <div className="footer-section">
              <h4>Discover</h4>
              <a href="#">Top Destinations</a>
              <a href="#">Travel Guides</a>
              <a href="#">Flight Deals</a>
              <a href="#">Hotel Offers</a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 TravelAI. All rights reserved. Made with ❤️ for travelers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
