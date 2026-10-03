import React, { useState } from 'react'
import Modal from "./Modal"

const PropertyImg = ({images}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleShowAllPhotos = () =>{
        setIsModalOpen(true)
    }

    const handleCloseModal =()=>{
        setIsModalOpen(false)
    }

    // //Static Images
    // const images = [
    //     {url: "/assets/property2.webp"},
    //     {url:"/assets/property3.webp"},
    //     {url:"/assets/property4.webp"},
    //     {url:"/assets/property5.webp"},
    //     {url:"/assets/property3.webp"},
    //     {url:"/assets/property3.webp"},
    //     {url:"/assets/property3.webp"}
    // ]


  return (
    <>
    <div className='property-img-container'>
        <div className='img-item'>
            <img src={images[0].url} 
            className='images' 
            style={{borderTopLeftRadius:"10px", borderBottomLeftRadius:"10px"}}
            alt='property-1'
            />

        </div>

        <div>
            <img className='images' src={images[1].url} alt='property'/>
        </div>
         <div>
            <img className='images' src={images[2].url} alt='property'/>
        </div>
         <div>
            <img className='images' src={images[3].url} alt='property'/>
        </div>
      
      <div >
        <img className='images' src={images[5].url} 
        style={{borderBottomRightRadius:"10px"}}
        />
        <button className='similar-photos' onClick={handleShowAllPhotos}>
            <span className='material-symbols-outlined'>photo_library</span>

        </button>

      </div>
    </div>

    <div className='similar-photos-container'></div>
    {isModalOpen && <Modal images={images} onClose={handleCloseModal}/>}
    </>
  )
}

export default PropertyImg
 