import { useState } from "react";

import api from "../../utils/api";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import InputAdornment from "@mui/material/InputAdornment";
import { Icon } from "@iconify/react";

import logo3 from "../../assets/igot_complete.svg";

import { useRouter } from "../../routes/hooks";

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const handleLogin = async () => {
    setLoading(true); 
    setError(null);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        router.push("../");
      } else {
        console.error("Login failed:", response.data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false); 
    }
  };

  const renderForm = (
    <>
      <Stack spacing={3}>
        <TextField
          name="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  <Box
                    component={Icon}
                    className="component-iconify"
                    icon={showPassword ? "eva:eye-fill" : "eva:eye-off-fill"}
                    sx={{ width: 20, height: 20 }}
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {error && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          sx={{ my: 2, color: "red" }}
        >
          <p>{error}</p>
        </Stack>
      )}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        sx={{ my: 3 }}
      >
        <Link variant="subtitle2" underline="hover">
          Forgot password?
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        onClick={handleLogin}
        loading={loading} 
        sx={{
          backgroundColor: "black",
          borderRadius: 2,
          color: "white",
          "&:hover": {
            backgroundColor: "grey",
          },
        }}
      >
        Login
      </LoadingButton>
    </>
  );

  return (
    <Box
      sx={{
        backdropFilter: "blur(10px)",
        backgroundImage: "linear-gradient(to bottom right, #fffdaf, white)",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        component="div"
        sx={{
          width: 40,
          height: 40,
          position: "fixed",
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },

          display: "inline-flex",
        }}
        onClick={() => {
          window.location.href = "/";
        }}
      >
        <img src={logo3} alt="igot" style={{ cursor: "pointer" }} />
      </Box>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100%", margin: "2rem" }}
      >
        <Card
          sx={{
            p: 5,
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 8px 8px rgba(0, 0, 0, 0.3)",
            borderRadius: 3,
            fontFamily: "Roboto, sans-serif",
            margin: "1rem", // Adding margin for small screens
            boxSizing: "border-box", // Ensuring padding doesn't affect width
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontFamily: "Roboto, sans-serif", fontWeight: "bold", mb: 2 }}
          >
            Welcome to iGOT CMS
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 2, mb: 5, fontFamily: "Roboto, sans-serif" }}
          >
            Admin Login
          </Typography>

          {renderForm}
        </Card>
      </Stack>
    </Box>
  );
}

export default LoginView;
