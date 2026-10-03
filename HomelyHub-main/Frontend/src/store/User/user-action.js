import { userActions } from "./user-slice";
import { axiosInstance } from "../../utils/axios";

// ── Helper: extract the most useful error message from an Axios error ──────
function getErrorMessage(error) {
    // Server responded with an error body
    if (error?.response?.data) {
        const d = error.response.data;
        return d.message || d.error || JSON.stringify(d);
    }
    // Network error (no response from server at all)
    if (error?.request) {
        return "Cannot connect to server. Please check if the backend is running.";
    }
    // Anything else
    return error?.message || "An unexpected error occurred.";
}

export const getSignup = (user) => async (dispatch) => {
    try {
        dispatch(userActions.getSignupRequest());
        const { data } = await axiosInstance.post("/v1/rent/user/signup", user);
        dispatch(userActions.getSignupDetails(data.user));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const getLogin = (user) => async (dispatch) => {
    try {
        dispatch(userActions.getLoginRequest());
        const { data } = await axiosInstance.post("/v1/rent/user/login", user);
        dispatch(userActions.getLoginDetails(data.user));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const currentUser = () => async (dispatch) => {
    try {
        dispatch(userActions.getCurrentUserRequest());
        const { data } = await axiosInstance.get("/v1/rent/user/me");
        dispatch(userActions.getCurrentUser(data.user));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const updateUser = (updateUser) => async (dispatch) => {
    try {
        dispatch(userActions.getUpdateUserRequest());
        const response = await axiosInstance.patch("/v1/rent/user/updateMe", updateUser);
        console.log("Update successful:", response.data);
        const { data } = await axiosInstance.get("/v1/rent/user/me");
        dispatch(userActions.getCurrentUser(data.user));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const forgotPassword = (email) => async (dispatch) => {
    try {
        await axiosInstance.post("/v1/rent/user/forgotPassword", { email });
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const resetPassword = (repassword, token) => async (dispatch) => {
    try {
        await axiosInstance.patch(`/v1/rent/user/resetPassword/${token}`, repassword);
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const updatePassword = (passwords) => async (dispatch) => {
    try {
        dispatch(userActions.getPasswordRequest());
        await axiosInstance.patch("/v1/rent/user/updatedMyPassword", passwords);
        dispatch(userActions.getPasswordSuccess(true));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}

export const logout = () => async (dispatch) => {
    try {
        await axiosInstance.get("/v1/rent/user/logout");
        dispatch(userActions.getLogout(null));
    } catch (error) {
        dispatch(userActions.getError(getErrorMessage(error)));
    }
}
