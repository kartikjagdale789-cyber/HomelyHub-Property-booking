import React from 'react'
import Header from './Header'
import {Outlet} from "react-router-dom"
import Footer from "./Footer"
import AITripPlanner from "../aiTripPlanner/AITripPlanner"

const Main = () => {
  return (
    <div>
      <Header/>
      <Outlet/>
      <Footer/>
      {/* AI Trip Planner floating chatbot — renders on every page */}
      <AITripPlanner/>
    </div>
  )
}

export default Main
