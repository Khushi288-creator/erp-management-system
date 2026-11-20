import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const savedUser = JSON.parse(localStorage.getItem("user") || "null");
const savedToken = localStorage.getItem("token");

const saveSession = (data) => {
  const { token, ...user } = data;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/login", credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (details, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/register", details);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Register failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser,
    token: savedToken,
    loading: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    const onPending = (state) => {
      state.loading = true;
    };
    const onFulfilled = (state, action) => {
      state.loading = false;
      const { token, ...user } = action.payload;
      state.user = user;
      state.token = token;
      saveSession(action.payload);
    };
    const onRejected = (state) => {
      state.loading = false;
    };

    builder
      .addCase(loginUser.pending, onPending)
      .addCase(loginUser.fulfilled, onFulfilled)
      .addCase(loginUser.rejected, onRejected)
      .addCase(registerUser.pending, onPending)
      .addCase(registerUser.fulfilled, onFulfilled)
      .addCase(registerUser.rejected, onRejected);
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;