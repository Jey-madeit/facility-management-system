import React, { useContext } from 'react';
import { Building2, Users, BoomBox, Rocket, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Home.css';
import Logo from '../assets/WAGPCo_Logo.png'

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="home-container">
        <div className="home-navbar">
          <h1 type="button" onClick={() => navigate('/home')}>
            <Building2 /> Faci-Hub
          </h1>
          <img src={Logo} alt='WAGPCo Logo' width={60} height={60}/>
          <div className="logout-btn-container">
            <button onClick={handleLogout} className="logout-btn">
              <h4>Log Out</h4>
              <LogOut size={15}  style={{ verticalAlign: 'middle'}}/>   LOG OUT
            </button>
          </div>
        </div>

        <header className="home-header">
          <div className="user-info">
            <span>Hello, {user?.username} {/*{user?.role === 'admin' && `(${user?.role})`}*/}</span>
          </div>
          <h2>Home Dashboard</h2>
          <p className='home-intro'>
            Welcome to the central hub for our facility operations <b>FACI-HUB</b>. 
            We've digitized our maintenance logs and asset tracking to provide a faster, 
            more reliable way to manage our physical environment. 
            High-uptime starts with high-quality data. <b>FACI-HUB</b> ensures that your facility 
            monitoring is accurate and up-to-date.
          </p>
        </header>

        <div className="sections-grid">
          <div 
            className="section-card"
            onClick={() => navigate('/testrun')}
          >
            <h2>
              <BoomBox size={20} style={{ marginRight: '8px', marginBottom: '4px', verticalAlign: 'middle' }} /> 
              Generator Test Run
            </h2>
            <p>Enter test run data and view performance metrics</p>
          </div>

          <div 
            className="section-card"
            onClick={() => navigate('/boosterpumps')}
          >
            <h2>
              <Rocket size={20} style={{ marginRight: '8px', marginBottom: '4px', verticalAlign: 'middle' }} /> 
              Booster Pumps
            </h2>
            <p>Enter pumps data and view performance metrics</p>
          </div>

          <div 
            className="section-card"
            onClick={() => navigate('/dailyinspection')}
          >
            <h2>
              <Calendar size={20} style={{ marginRight: '8px', marginBottom: '4px', verticalAlign: 'middle' }} /> 
              Daily Inspection
            </h2>
            <p>Multi-floor inspection forms</p>
            <p>External Assets, Ground, First and Second Floor</p>
          </div>

          {user?.role === 'admin' && (
            <>
              <div 
                className="section-card admin-card"
                onClick={() => navigate('/dashboard')}
              >
                <h2>
                  <Users size={20} style={{ marginRight: '8px', marginBottom: '4px', verticalAlign: 'middle' }} />
                  Admin Dashboard
                </h2>
                <p>Review live status summary and recent activity</p>
              </div>
              <div 
                className="section-card admin-card"
                onClick={() => navigate('/users')}
              >
                <h2>
                  <Users size={20} style={{ marginRight: '8px', marginBottom: '4px', verticalAlign: 'middle' }} />
                  User Management
                </h2>
                <p>Manage system users and permissions</p>
              </div>
            </>
          )}
        </div>
      </div>
      <footer className='footer'>
        <div className="footer-top">
          <div className="footer-column">
            <h4>Quick Access</h4>
            <button type="button" onClick={() => navigate('/testrun')}>Generator Test Run</button>
            <button type="button" onClick={() => navigate('/boosterpumps')}>Booster Pumps</button>
            <button type="button" onClick={() => navigate('/dailyinspection')}>Daily Inspection</button>
            {user?.role === 'admin' && (
              <>
                <button type="button" onClick={() => navigate('/dashboard')}>Operational Dashboard</button>
                <button type="button" onClick={() => navigate('/users')}>User Management</button>
              </>
            )}
          </div>

          <div className="footer-column">
            <h4>Operational Features</h4>
            <ol>
              <li>Data entry for:
                <ul>
                  <li>Generator Test Run</li>
                  <li>Booster Pumps Alternation</li>
                  <li>Multi-floor Inspection</li>
                </ul>
              </li>
              <li>Structured submitted data visibility</li>
              <li>Search and filter data capabilities</li>
              {user?.role === 'admin' &&(
                <li>Export and import data functionality</li>
              )}
              { user?.role === 'admin' && (
                <li>User and account management for admins</li>
              )}
            </ol>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <p>Need any assistance contact IT Department/Log the issue on the service desk</p>
            <p>Hours: Mon-Fri, 8:00 AM - 5:00 PM</p>
          </div>
        </div>


        <div className="footer-bottom">
          <p style={{ color: '#ff0069' }}>&#119070; L. D JEY 🔒</p>
          <p>&copy; 2026 WAGPCO. All rights reserved.</p>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={16}  style={{ verticalAlign: 'middle'}}/>  LOG OUT 
          </button>
        </div>

      </footer>
    </>
  );
};

export default Home;
