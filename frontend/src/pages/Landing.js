import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Calendar, CheckCircle2 } from 'lucide-react';
import '../styles/Landing.css';
import Logo from '../assets/WAGPCo_Logo.png';
import '../assets/inspection.webp';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
        <div className="landing-page">
            <div className="landing-hero">
                <div className="landing-hero-copy">
                    <img src={Logo} alt="WAGPCo Logo" className="landing-logo" />
                    <span className="landing-tag">WAGPCo</span>
                    <h1>Streamline your operations with FACI-HUB.</h1>
                    <p>
                      Our centralized platform simplifies facility management by providing a secure, 
                      modern workspace to log generator tests, record booster pumps 
                      and input facility inspection data.
                    </p>
                    <div className="landing-actions">
                        <button className="landing-button primary" onClick={() => navigate('/login')}>
                         Get Started
                        </button>
                        {/*<button className="landing-button secondary" onClick={() => navigate('/login')}>
                         Login
                        </button>*/}
                    </div>
                </div>

                <div className="landing-hero-features">
                    <div className="feature-card">
                        <h2>
                            <Rocket size={22} style={{ marginRight: '8px', 
                                marginBottom: '4px', verticalAlign: 'middle' }} />
                            Asset Tracking
                        </h2>
                        <p>Keep pump, generator, and inspection data in one place.</p>
                    </div>
                    <div className="feature-card">
                        <h2>
                            <Calendar size={22} style={{ marginRight: '8px', 
                                marginBottom: '5px', verticalAlign: 'middle' }} />
                            Daily Inspections
                        </h2>
                        <p>Capture checklists for every floor and every shift.</p>
                    </div>
                    <div className="feature-card">
                        <h2>
                            <CheckCircle2 size={25} style={{ marginRight: '8px', 
                                marginBottom: '4px', verticalAlign: 'middle' }} />
                            Team Collaboration
                        </h2>
                        <p>Role-based access helps admins and operators work together.</p>
                    </div>
                </div>
            </div>
        </div>

        <section className="landing-footer">
            <div>
                <h3>Trusted operations tools</h3>
                <p>Secure, responsive facility workflow built for reliability and uptime.</p>
            </div>
            <div className="landing-footer-note">&copy; 2026 WAGPCO. All rights reserved.</div>
        </section>
    </>
  );
};

export default Landing;
