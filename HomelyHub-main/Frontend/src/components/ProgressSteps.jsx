import React from 'react'
import {NavLink,useLocation} from "react-router-dom"
import "../css/ProgressSteps.css"

const ProgressSteps = () => {
  const location = useLocation();
  return (
    <div className='checkout-progress d-flex justify-content-center mt-5'>
      <NavLink
      to="/profile"
      className={`progress-button ${location.pathname === "/profile"? "active-button" : ""}`}
      >
        My Profile
      </NavLink>

      <NavLink 
      to="/user/mybookings"
      className={`progress-button ${location.pathname == "/user/mybookings" ? "active-button" : ""}`}
      >
        My Bookings
      </NavLink>
      
      <NavLink 
      to="/accomodation"
      className={`progress-button ${location.pathname == "/accomodation" ? "active-button" : ""}`}
      >
        My Accomodations
      </NavLink>
    </div>
  )
}

export default ProgressSteps
