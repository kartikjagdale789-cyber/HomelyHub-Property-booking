import React from 'react'
import "../../css/Home.css"
import Search from './Search'
import Filter from './Filter'
import {Link, useNavigate} from "react-router-dom"
import { useDispatch, useSelector } from 'react-redux'
import {logout} from "../../store/User/user-action"
import { propertyAction } from '../../store/Property/property-slice'
import { getAllProperties } from '../../store/Property/property-action'
import toast from 'react-hot-toast'

const Header = () => {

    const {isAuthenticated, user} = useSelector((state)=>state.user)
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const logoutUser =() =>{
        dispatch(logout());
        toast.success("User has Loggedout successfully")
        navigate("/")
    }

    const refreshFunction =() =>{
        dispatch(propertyAction.updateSearchParams({}));
        dispatch(getAllProperties())
    }

  return (
    <>
    <nav className='header row sticky-top'>
        <Link to="/">
                <img src='/assets/logo.png' alt='logo' className='logo' onClick={refreshFunction}/>

        </Link>
        <div className='search_filter'>
            <Search/>
            <Filter/>
        </div>

       {!isAuthenticated && !user &&(
        <Link to="/login">
        <span className='material-symbols-outlined web_logo'>
           account_circle
        </span>
        </Link>
       )}

       {isAuthenticated && user && ( 
        <div className='dropdown'>
            <span 
            className='material-symbols-outlined web_logo dropdown-toggle' 
            role='button' 
            href = "#"
            id="dropdownMenuLink"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            >

             {user.avatar.url &&(
                <img
                    src={user.avatar.url}
                    alt='icon'
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        flexShrink: 0,
                    }}
                />
            )}      
            {!user.avatar.url && "account_circle"}
            </span>

            <ul className='dropdown-menu' aria-labelledby='dropdownMenuLink'>
                <li>
                    <Link className='dropdown-item' to='/profile'>My Account</Link>
                </li>
                <li>
                    <button className='dropdown-item' type='button' onClick={logoutUser}>Logout</button>
                </li>
            </ul>
        </div>)}
    </nav>
      
    </>
  )
}

export default Header
