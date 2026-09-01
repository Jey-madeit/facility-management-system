import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/WAGPCo_Logo.png';
import '../styles/NavBar.css';

const NavBar = ({ heading }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button className="back-button" onClick={handleBack} title="Go back">
          <ChevronLeft size={24} /> Back To Home
        </button>
        <h1 className="navbar-heading">{heading}</h1>
        <img src={Logo} alt="WAGPCo Logo" className="navbar-logo" />
      </div>
    </nav>
  );
};

export default NavBar;
