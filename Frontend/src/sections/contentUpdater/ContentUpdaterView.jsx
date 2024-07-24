import React, { useState, useEffect } from "react";
import axios from "axios";
import WebsiteSelector from "./WebsiteSelector";
import { Container, Box, Typography, Paper, Grid, Button } from "@mui/material";
import AppWidgetSummary from "./AppWidgetSummary";
import TextManagerView from "./TextContentManager/TextManagerView";
import MediaContentManager from "./MediaContentManager/MediaContentManager";

function ContentUpdaterView() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [selectedWebsiteBucket, setSelectedWebsiteBucket] = useState("");
  const [selectedCard, setSelectedCard] = useState(""); // State to track which card is updated

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/website`
        );
        setWebsites(response.data);
        if (response.data.length > 0) {
          console.log(response);
          setSelectedWebsite(response.data[0].url);
          setSelectedWebsiteBucket(response.data[0].bucketName);
        }
      } catch (error) {
        console.error("Error fetching websites :", error);
      }
    };

    fetchWebsites();
  }, []);

  const handleCardClick = (cardName) => {
    setSelectedCard(cardName); // Update the state when a card is clicked
  };

  const handleBackClick = () => {
    setSelectedCard(""); // Reset the state to go back to the main screen
  };

  return (
    <Container sx={{ mt: 4 }}>
      {selectedCard ? (
        <>
          <Paper elevation={2} sx={{ p: 4, my: 4, borderRadius: 8 }}>
            <Button variant="contained" onClick={handleBackClick}>
              Back
            </Button>
            <Box textAlign="center">
              <Typography variant="h5" gutterBottom>
                {selectedCard} Selected
              </Typography>
            </Box>
          </Paper>

          {selectedCard === "Text Content Manager" && (
            <TextManagerView selectedWebsiteBucket={selectedWebsiteBucket} />
          )}
          {selectedCard === "Media Content Updater" && (
            <MediaContentManager
              selectedWebsiteBucket={selectedWebsiteBucket}
            />
          )}
        </>
      ) : (
        <>
          <Paper elevation={2} sx={{ p: 4, my: 5, borderRadius: 8 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Content Updater
            </Typography>
            <WebsiteSelector
              // bucketName={bucketName}
              setSelectedWebsiteBucket={setSelectedWebsiteBucket}
              websites={websites}
              selectedWebsite={selectedWebsite}
              setSelectedWebsite={setSelectedWebsite}
            />
            <Box mt={1} textAlign="center">
              <Typography variant="h6" gutterBottom>
                Selected Website
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {selectedWebsite}
              </Typography>
            </Box>
            <Box mt={1} textAlign="center">
              <Typography variant="h6" gutterBottom>
                Selected Website's Bucket
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {selectedWebsiteBucket}
              </Typography>
            </Box>
          </Paper>

          <Grid container spacing={3} m={5} gap={4}>
            <Grid item xs={10} sm={6} md={5}>
              <AppWidgetSummary
                title="Text Content Manager"
                color="success"
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    cursor: "pointer",
                  },
                }}
                onClick={() => handleCardClick("Text Content Manager")}
                icon={<img alt="icon" src="/icons/glass/website.png" />}
              />
            </Grid>
            <Grid item xs={10} sm={6} md={5}>
              <AppWidgetSummary
                title="Media Content Updater"
                color="info"
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    cursor: "pointer",
                  },
                }}
                onClick={() => handleCardClick("Media Content Updater")}
                icon={
                  <img
                    style={{ width: "4rem" }}
                    alt="icon"
                    src="/icons/glass/addWeb.png"
                  />
                }
              />
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}

export default ContentUpdaterView;
