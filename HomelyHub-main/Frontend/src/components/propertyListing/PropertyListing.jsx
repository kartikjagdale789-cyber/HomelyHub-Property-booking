import React, { useEffect } from 'react'
import PropertyImg from './PropertyImg'
import "../../css/PropertyListing.css"
import PropertyAmenities from './PropertyAmenities'
import PaymentForm from './PaymentForm'
import PropertyMapInfo from './PropertyMapInfo'

import {useDispatch, useSelector} from "react-redux"
import { useParams } from 'react-router-dom'
import { getPropertyDetails } from '../../store/PropertyDetails/propertyDetails-action'
import LoadingSpinner from '../LoadingSpinner'

const PropertyListing = () => {
  const dispatch = useDispatch();
  const {id} = useParams();
  const{loading, propertyDetails} = useSelector((state)=> state.propertyDetails)
  useEffect(()=> {
    dispatch(getPropertyDetails(id))
  },[dispatch,id])

  if(loading || !propertyDetails)
    {
      return (<div className='row justify-content-around mt-5'>
      <LoadingSpinner/>
      </div>
      );
    }

  const { 
    propertyName, 
    address, 
    description, 
    images, 
    amenities,
    maximumGuest, 
    price, 
    currentBookings
    } = propertyDetails;

  return (
    <div className='property-container'>
        <p className='property-header'> {propertyName}</p>
         <h6 className='property-location'>
            <span className='material-symbols-outlined'>House</span>
            <span className='location'> 
              {`${address?.area}, ${address?.city}, ${address?.state}`}
            </span>
         </h6>
         <PropertyImg images={images}/>
         
         <div className='middle-container row'>
            <div className='des-and-amenities col-md-8 col-sm-12 col-12'>
                <h2 className='property-description-header'> Description</h2>
                <p className='property-description'> {description}
                    <br/><br/> Max number of guests: {maximumGuest}
                </p>
                <hr/>
                <PropertyAmenities amenities={amenities}/>
            </div>

            <div className='property-payment col-md-4 col-sm-12 col-12'>
              <PaymentForm 
              propertyId={id}
              price={price}
              propertyName={propertyName}
              address={address}
              maximumGuest={maximumGuest}
              currentBookings={currentBookings}
              />
            </div>
         </div>
         <hr/>
         <div className='property-map'>
            <div className='map-image-exinfo-container row'>
              <PropertyMapInfo address={address} />
            </div>
         </div>
    </div>
  )
}

export default PropertyListing
