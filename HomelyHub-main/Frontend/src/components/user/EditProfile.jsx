import React, { Fragment, useEffect, useState } from 'react'
import "../../css/Profile.css";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../store/User/user-action";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { userActions } from '../../store/User/user-slice';
import LoadingSpinner from "../LoadingSpinner";

const EditProfile = () => {
    const { user, errors, loading } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || "https://i.pravatar.cc/150?img=3");
    const [newAvatarBase64, setNewAvatarBase64] = useState(null); // only set when user picks a new file

    // Keep fields in sync if Redux user updates
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhoneNumber(user.phoneNumber || "");
            setAvatarPreview(user.avatar?.url || "https://i.pravatar.cc/150?img=3");
        }
    }, [user]);

    // Show errors from Redux
    useEffect(() => {
        if (errors && errors.length > 0) {
            toast.error(errors);
            dispatch(userActions.clearErrors());
        }
    }, [errors, dispatch]);

    // When user picks a file — convert to base64 for preview + upload
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate type and size (max 2 MB)
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be smaller than 2 MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);   // show preview immediately
                setNewAvatarBase64(reader.result); // will be sent to backend
            }
        };
        reader.readAsDataURL(file);
    };

    const submitHandler = (e) => {
        e.preventDefault();

        const updatedFields = {};

        if (name.trim() !== user?.name) updatedFields.name = name.trim();
        if (phoneNumber.trim() !== user?.phoneNumber) updatedFields.phoneNumber = phoneNumber.trim();
        if (newAvatarBase64) updatedFields.avatar = newAvatarBase64; // base64 only if changed

        if (Object.keys(updatedFields).length === 0) {
            toast("No changes made.");
            return;
        }

        dispatch(updateUser(updatedFields));
        navigate("/profile");
        toast.success("Profile updated successfully!");
    };

    return (
        <Fragment>
            <div className='row wrapper'>
                {loading && <LoadingSpinner />}
                {!loading && (
                    <div className='col-10 col-lg-5 updateprofile'>
                        <form onSubmit={submitHandler} encType='multipart/form-data'>
                            <h1 className='mt-2 mb-5'>Update Profile</h1>

                            {/* Name */}
                            <div className="form-group">
                                <label htmlFor='name_field'>Name</label>
                                <input
                                    type='text'
                                    id='name_field'
                                    className='form-control'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Phone */}
                            <div className="form-group">
                                <label htmlFor='phone_field'>Phone Number</label>
                                <input
                                    type='text'
                                    id='phone_field'
                                    className='form-control'
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>

                            {/* Avatar */}
                            <div className="form-group">
                                <label>Profile Photo</label>
                                <div className='d-flex align-items-center' style={{ gap: '1.5rem', marginTop: '0.5rem' }}>
                                    {/* Preview circle */}
                                    <figure className='avatar mr-3 item-rtl' style={{ margin: 0 }}>
                                        <img
                                            src={avatarPreview}
                                            className='rounded-circle'
                                            alt='Avatar Preview'
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid #0e8b53' }}
                                            onError={(e) => { e.target.src = "https://i.pravatar.cc/150?img=3"; }}
                                        />
                                    </figure>

                                    {/* File picker */}
                                    <div className='custom-file' style={{ flex: 1 }}>
                                        <input
                                            type='file'
                                            className='custom-file-input'
                                            id='avatar_upload'
                                            accept='image/*'
                                            onChange={onFileChange}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <label className='custom-file-label' htmlFor='avatar_upload'>
                                            {newAvatarBase64 ? "✅ New photo selected" : "Choose Photo"}
                                        </label>
                                    </div>
                                </div>
                                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                                    Max size: 2 MB · JPG, PNG, WEBP
                                </small>
                            </div>

                            <button type='submit' className='update-btn btn-block'>
                                Update Profile
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </Fragment>
    );
};

export default EditProfile;
