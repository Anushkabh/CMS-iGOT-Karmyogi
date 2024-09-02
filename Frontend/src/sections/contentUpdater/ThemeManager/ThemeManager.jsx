import React, { useState, useEffect } from "react";
import {
  Button,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Box,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import FolderSelect from "./FolderSelect";
import AddNewPage from "./AddNewFolder";
import DeletePage from "./DeleteFolder";
import UserPage from "./TableView/view/gcp-table-content-view";
import AddFileDialog from "./AddFileSection";

function ThemeManager({ selectedWebsiteBucket }) {
  const [contentFetchedPageId, setContentFetchedPageId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [folderContent, setFolderContent] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [pages, setPages] = useState([]);
  const [pagesFiltered, setPagesFiltered] = useState([]);
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [showAddNewFileDialog, setShowAddNewFileDialog] = useState(false);
  const [showDeletePageDialog, setShowDeletePageDialog] = useState(false);
  const [loadingSetTheme, setLoadingSetTheme] = useState(false);
  const [loadingFetchContent, setLoadingFetchContent] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [selectedWebsiteBucket]);

  useEffect(() => {
    setShowAddNewFileDialog(false);
    setFolderContent(null);
  }, [selectedPageId, setSelectedThemeId]);

  const handleSetTheme = async (pageId) => {
    setLoadingSetTheme(true);
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/setTheme/${selectedWebsiteBucket}/${pageId}`
      );
      setSuccessMessage("Theme set successfully!");
      console.log("Theme set for page:", pageId);
    } catch (error) {
      console.error("Error setting theme:", error);
      setError("Failed to set theme. Please try again.");
    }
    setLoadingSetTheme(false);
  };

  const fetchContent = async (pageId) => {
    setLoadingFetchContent(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/currfolders/${selectedWebsiteBucket}/${pageId}`
      );
      console.log(pageId);
      setContentFetchedPageId(pageId);
      setContentFetchedPageId(pageId);

      setSuccessMessage("Content Fetched successfully!");
      setFolderContent(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching content:", error);
      setError("Failed to fetch content. Please try again.");
    }
    setLoadingFetchContent(false);
  };

  const fetchPages = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/currfolders/${selectedWebsiteBucket}`
      );
      const filteredPages = response.data.filter(
        (page) => page !== "current_theme"
      );

      setPagesFiltered(filteredPages);
      setPages(response.data);
      setSelectedPageId(response.data[0] || "");
      setSelectedThemeId(filteredPages[0] || "");
    } catch (error) {
      console.error("Error fetching pages:", error);
      setError("Failed to fetch pages. Please try again.");
    }
  };

  const handleCreateNewPage = async (newPageId) => {
    setLoadingSetTheme(true);
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/media/folders/${selectedWebsiteBucket}`,
        {
          folderName: newPageId,
        }
      );
      setSuccessMessage("New folder created successfully!");
      fetchPages(); // Refresh the list of pages
    } catch (error) {
      console.error("Error creating new page:", error);
      setError("Failed to create new folder. Please try again.");
    }
    setLoadingSetTheme(false);
  };
  const handleCreateNewFile = async (newPageId) => {
    setLoadingFetchContent(true);
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/media/folders/${selectedWebsiteBucket}`,
        {
          folderName: newPageId,
        }
      );
      setSuccessMessage("New folder created successfully!");
      fetchPages(); // Refresh the list of pages
    } catch (error) {
      console.error("Error creating new page:", error);
      setError("Failed to create new folder. Please try again.");
    }
    setLoadingFetchContent(false);
  };

  const handleDeletePage = async (pageId) => {
    setLoadingSetTheme(true);
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/theme_manager_Store_gcp/media/folders/${selectedWebsiteBucket}/${pageId}`
      );
      setSuccessMessage("Folder deleted successfully!");
      fetchPages(); // Refresh the list of pages
      setSelectedPageId(pages[0] || "");
      setSelectedThemeId(pages[0] || "");
    } catch (error) {
      console.error("Error deleting page:", error);
      setError("Failed to delete folder. Please try again.");
    }
    setLoadingSetTheme(false);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage("");
  };

  const handlePageChange = (event) => {
    const pageId = event.target.value;
    setSelectedPageId(pageId);
  };
  const handleThemeChange = (event) => {
    const pageId = event.target.value;
    setSelectedThemeId(pageId);
  };

  return (
    <div>
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={error || successMessage}
      />
      <Paper sx={{ p: 4, my: 5, borderRadius: 8 }}>
        <Box p={3}>
          <Grid container spacing={3}>
            <Paper
              sx={{
                p: 4,
                my: 5,
                borderRadius: 8,
                width: "100%",
                backgroundColor: "#fffbef",
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    Set Theme
                  </Typography>
                  <FolderSelect
                    pages={pagesFiltered}
                    selectedPageId={selectedThemeId}
                    handlePageChange={handlePageChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                      px={2}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleSetTheme(selectedPageId)}
                        disabled={!selectedThemeId || loadingSetTheme}
                      >
                        {loadingSetTheme ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Set Theme"
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Box>
      </Paper>
      <Paper sx={{ p: 4, my: 5, borderRadius: 8 }}>
        <Box p={3}>
          <Grid container spacing={3}>
            <Paper
              sx={{
                p: 4,
                my: 5,
                borderRadius: 8,
                width: "100%",
                backgroundColor: "#fffbef",
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    Add Themes
                  </Typography>
                  <FolderSelect
                    pages={pages}
                    selectedPageId={selectedPageId}
                    handlePageChange={handlePageChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                      px={2}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => fetchContent(selectedPageId)}
                        disabled={!selectedPageId || loadingFetchContent}
                      >
                        {loadingFetchContent ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Fetch Content"
                        )}
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowAddPageDialog(true)}
                      >
                        Add Folder
                      </Button>
                      <Button
                        onClick={() => setShowDeletePageDialog(true)}
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 2, ml: 2 }}
                      >
                        Delete Folder
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Box>
      </Paper>

      <AddNewPage
        selectedWebsiteBucket={selectedWebsiteBucket}
        open={showAddPageDialog}
        onClose={() => setShowAddPageDialog(false)}
        handleCreateNewPage={handleCreateNewPage}
      />
      <DeletePage
        open={showDeletePageDialog}
        onClose={() => setShowDeletePageDialog(false)}
        handleDeletePage={handleDeletePage}
        pages={pages}
        fetchedSelectedPageId={selectedPageId}
      />

      {folderContent && (
        <UserPage
          fetchContent={fetchContent}
          setSuccessMessage={setSuccessMessage}
          showAddNewFileDialog={showAddNewFileDialog}
          selectedWebsiteBucket={selectedWebsiteBucket}
          handleCreateNewFile={handleCreateNewFile}
          setShowAddNewFileDialog={setShowAddNewFileDialog}
          selectedPageId={contentFetchedPageId}
          folderContent={folderContent}
        />
      )}
    </div>
  );
}

export default ThemeManager;
