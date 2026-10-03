import "./App.css";

import Main from "./components/home/Main";

import { BrowserRouter as Router, Routes, Route,Navigate } from "react-router-dom";
import PropertyList from "./components/home/PropertyList"
import PropertyListing from "./components/propertyListing/PropertyListing";

import Login from "./components/user/Login";
import Signup from "./components/user/Signup";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { userActions } from "./store/User/user-slice";
import { currentUser } from "./store/User/user-action";
import Profile from "./components/user/Profile";
import EditProfile from "./components/user/EditProfile";

import BookingDetails from "./components/myBookings/BookingDetails";
import MyBookings from "./components/myBookings/MyBookings";
import Payment from "./components/payment/Payment"
import NotFound from "./components/NotFound"

import Accomodation from "./components/accomodation/Accomodation"
import AccomodationForm from "./components/accomodation/AccomodationForm"

function App() {
  const dispatch = useDispatch();
  const{errors,user} = useSelector((state)=> state.user)
  useEffect(()=>{
    if(errors){
      dispatch(userActions.clearErrors());
    }
  }, [dispatch]);

  return (
    <div className="App">
    <Router>
       <Routes>
        <Route path="/" element={<Main/>} >
            <Route index element={<PropertyList/>}/>
            <Route path="propertylist/:id" element={<PropertyListing/>}/>

            {/* user routes */}
            <Route path="login" element={<Login/>}/>
            <Route path="signup" element={<Signup/>}/>
            <Route  path="profile" element={<Profile/>}/>
            <Route  path="editprofile" element={user? <EditProfile/> : <Navigate to="/login" />} />
             
            {/* Booking route  */}
            <Route path="user/mybookings" element={user ? <MyBookings/> : <Navigate to="/login"/>}/>
            <Route path="user/mybookings/:bookingId" element={user ? <BookingDetails/> : <Navigate to="/login" />}/>

            {/* Payment Route */}
            <Route path="payment/:propertyId" element={user ? <Payment/> : <Navigate to="/login"/>}/>

            {/* 404 Not found */}
            <Route path="*" element={<NotFound/>}/>

            {/* Accomodation Routes */}
            <Route path="accomodation" element={<Accomodation/>}/>
            <Route path="accomodationform" element={<AccomodationForm/>}/>
        
        </Route>
       </Routes>
    </Router>
    </div>
  );
}

export default App;
